-- Complete purchase and giveaway deals as soon as they are accepted.
-- Lending deals remain active until their borrowing period ends or they are returned.

CREATE OR REPLACE FUNCTION public.respond_to_offer(
  p_offer_id bigint,
  p_action text,
  p_counter_price numeric DEFAULT NULL,
  p_counter_start timestamptz DEFAULT NULL,
  p_counter_end timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_next_offer_status text;
  v_next_listing_status text;
  v_detail text;
  v_actor text;
  v_price_text text;
  v_is_seller boolean;
  v_is_buyer boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_action NOT IN ('accept', 'decline', 'counter') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id FOR UPDATE;

  v_is_seller := v_listing.seller_id = auth.uid();
  v_is_buyer := v_offer.buyer_id = auth.uid();
  PERFORM set_config('app.listing_rpc', 'on', true);

  IF p_action = 'counter' THEN
    IF NOT v_is_seller AND NOT v_is_buyer AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only the buyer or seller can counter this request';
    END IF;
    IF v_offer.status NOT IN ('pending', 'countered', 'declined') THEN
      RAISE EXCEPTION 'This request is no longer pending';
    END IF;
    IF v_offer.status = 'declined' AND NOT v_is_seller AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only the seller can reopen a declined offer';
    END IF;
    IF v_listing.status <> 'live' THEN
      RAISE EXCEPTION 'This listing is no longer available';
    END IF;
    IF v_offer.kind = 'claim' THEN
      RAISE EXCEPTION 'Claims cannot be countered';
    END IF;
    IF v_offer.kind = 'offer' THEN
      IF p_counter_price IS NULL OR p_counter_price <= 0 THEN
        RAISE EXCEPTION 'Enter a valid counter price';
      END IF;
      IF p_counter_price = trunc(p_counter_price) THEN
        v_price_text := trim(to_char(p_counter_price, 'FM999999999990'));
      ELSE
        v_price_text := trim(to_char(p_counter_price, 'FM999999999990.00'));
      END IF;
      v_detail := format('Offer: HK$%s', v_price_text);
      UPDATE public.offers
      SET status = 'countered', price = p_counter_price, detail = v_detail
      WHERE id = p_offer_id;
    ELSE
      IF p_counter_start IS NULL OR p_counter_end IS NULL OR p_counter_end < p_counter_start + interval '5 seconds' THEN
        RAISE EXCEPTION 'Choose a valid lending period of at least 5 seconds';
      END IF;
      v_detail := format(
        'Borrow request: %s → %s',
        to_char(p_counter_start AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am'),
        to_char(p_counter_end AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am')
      );
      UPDATE public.offers
      SET status = 'countered', start_at = p_counter_start, end_at = p_counter_end, detail = v_detail
      WHERE id = p_offer_id;
    END IF;

    IF v_is_buyer THEN
      SELECT username INTO v_actor FROM public.profiles WHERE id = v_offer.buyer_id;
      PERFORM public.notify_user(
        v_listing.seller_id, 'Offer', 'Buyer sent a counter',
        format('@%s countered for “%s”. %s', v_actor, v_listing.title, v_detail),
        'inbox', 'gold', 'View listing'
      );
    ELSE
      SELECT username INTO v_actor FROM public.profiles WHERE id = v_listing.seller_id;
      PERFORM public.notify_user(
        v_offer.buyer_id, 'Offer', 'Seller sent a counter',
        format('@%s countered your %s for “%s”. %s', v_actor, CASE WHEN v_offer.kind = 'borrow' THEN 'borrow request' ELSE 'offer' END, v_listing.title, v_detail),
        'inbox', 'gold', 'View deal'
      );
    END IF;
    RETURN;
  END IF;

  IF NOT v_is_seller AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the seller can accept or decline this request';
  END IF;
  IF v_offer.status NOT IN ('pending', 'countered') THEN
    RAISE EXCEPTION 'This request is no longer pending';
  END IF;

  SELECT username INTO v_actor FROM public.profiles WHERE id = v_listing.seller_id;

  IF p_action = 'decline' THEN
    UPDATE public.offers SET status = 'declined' WHERE id = p_offer_id;
    IF v_offer.kind = 'claim' AND v_listing.status = 'reserved' THEN
      UPDATE public.listings SET status = 'live' WHERE id = v_listing.id;
    END IF;
    PERFORM public.notify_user(
      v_offer.buyer_id, 'Offer', 'Offer declined',
      format('@%s declined your %s for “%s”.', v_actor, CASE v_offer.kind WHEN 'borrow' THEN 'borrow request' WHEN 'claim' THEN 'claim' ELSE 'offer' END, v_listing.title),
      'x', 'red', 'View listing'
    );
    RETURN;
  END IF;

  v_next_offer_status := CASE v_offer.kind
    WHEN 'borrow' THEN 'accepted'
    ELSE 'completed'
  END;
  v_next_listing_status := CASE v_offer.kind
    WHEN 'offer' THEN 'sold'
    WHEN 'borrow' THEN 'lent'
    ELSE 'given'
  END;

  UPDATE public.offers
  SET status = v_next_offer_status,
      completed_at = CASE WHEN v_next_offer_status = 'completed' THEN now() ELSE NULL END
  WHERE id = p_offer_id;

  UPDATE public.offers
  SET status = 'declined',
      detail = coalesce(detail || ' · ', '') || 'Automatically declined because another request was accepted'
  WHERE listing_id = v_listing.id
    AND id <> p_offer_id
    AND status IN ('pending', 'countered');

  UPDATE public.listings SET status = v_next_listing_status WHERE id = v_listing.id;

  PERFORM public.notify_user(
    v_offer.buyer_id, 'Offer',
    CASE WHEN v_next_offer_status = 'completed' THEN 'Deal completed' ELSE 'Your offer was accepted' END,
    CASE WHEN v_next_offer_status = 'completed'
      THEN format('@%s accepted your %s for “%s”. The deal is complete.', v_actor, CASE v_offer.kind WHEN 'claim' THEN 'claim' ELSE 'offer' END, v_listing.title)
      ELSE format('@%s accepted your borrow request for “%s”. Listing is now lent.', v_actor, v_listing.title)
    END,
    'check', 'green', 'View deal'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_counter_offer(p_offer_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_next_offer_status text;
  v_next_listing_status text;
  v_buyer text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  IF v_offer.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can accept this counter offer';
  END IF;
  IF v_offer.status <> 'countered' THEN
    RAISE EXCEPTION 'This counter offer is no longer available';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id FOR UPDATE;
  IF v_listing.status <> 'live' THEN
    RAISE EXCEPTION 'This listing is no longer available';
  END IF;

  v_next_offer_status := CASE v_offer.kind
    WHEN 'borrow' THEN 'accepted'
    ELSE 'completed'
  END;
  v_next_listing_status := CASE v_offer.kind
    WHEN 'offer' THEN 'sold'
    WHEN 'borrow' THEN 'lent'
    ELSE 'given'
  END;

  PERFORM set_config('app.listing_rpc', 'on', true);
  UPDATE public.offers
  SET status = v_next_offer_status,
      completed_at = CASE WHEN v_next_offer_status = 'completed' THEN now() ELSE NULL END
  WHERE id = p_offer_id;
  UPDATE public.offers
  SET status = 'declined',
      detail = coalesce(detail || ' · ', '') || 'Automatically declined because another request was accepted'
  WHERE listing_id = v_listing.id
    AND id <> p_offer_id
    AND status IN ('pending', 'countered');
  UPDATE public.listings SET status = v_next_listing_status WHERE id = v_listing.id;

  SELECT username INTO v_buyer FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_listing.seller_id, 'Offer',
    CASE WHEN v_next_offer_status = 'completed' THEN 'Counter offer completed' ELSE 'Counter offer accepted' END,
    format('@%s accepted your counter for “%s”. Listing is now %s.', v_buyer, v_listing.title, v_next_listing_status),
    'check', 'green', 'View listing'
  );
END;
$$;

-- Reconcile deals that were already accepted before this migration.
UPDATE public.offers
SET status = 'completed',
    completed_at = coalesce(completed_at, now())
WHERE kind IN ('offer', 'claim')
  AND status = 'accepted';

UPDATE public.listings l
SET status = CASE o.kind WHEN 'offer' THEN 'sold' ELSE 'given' END
FROM public.offers o
WHERE o.listing_id = l.id
  AND o.status = 'completed'
  AND o.kind IN ('offer', 'claim');

GRANT EXECUTE ON FUNCTION public.respond_to_offer(bigint, text, numeric, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_counter_offer(bigint) TO authenticated;
