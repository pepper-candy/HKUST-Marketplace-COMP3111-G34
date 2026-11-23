-- Canvas Task 1.5–1.6 deal flow.
-- Sell/Lend: seller Accept does not finish the deal.
-- Giveaway: one-click first claim wins; no seller Accept/bargain.
-- Buy now: listed price, skip bargain, still wait for buyer mark-complete.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.reconcile_offer_listing_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.listing_rpc', 'on', true);

  IF NEW.status = 'accepted' THEN
    UPDATE public.listings
    SET status = CASE NEW.kind
      WHEN 'borrow' THEN 'lent'
      ELSE 'reserved'
    END
    WHERE id = NEW.listing_id;
  ELSIF NEW.status = 'completed' THEN
    UPDATE public.listings
    SET status = CASE NEW.kind
      WHEN 'offer' THEN 'sold'
      WHEN 'borrow' THEN 'lent'
      ELSE 'given'
    END
    WHERE id = NEW.listing_id;
  ELSIF NEW.status = 'returned' AND NEW.kind = 'borrow' THEN
    UPDATE public.listings SET status = 'live' WHERE id = NEW.listing_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS offers_reconcile_listing_status ON public.offers;
CREATE TRIGGER offers_reconcile_listing_status
AFTER INSERT OR UPDATE OF status ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.reconcile_offer_listing_status();

UPDATE public.offers o
SET status = 'accepted',
    completed_at = NULL
FROM (
  SELECT DISTINCT ON (listing_id) id
  FROM public.offers
  WHERE kind = 'claim' AND status = 'pending'
  ORDER BY listing_id, created_at ASC, id ASC
) first_claim
WHERE o.id = first_claim.id;

UPDATE public.offers
SET status = 'declined',
    detail = coalesce(detail || ' · ', '') || 'Automatically declined because another request was accepted'
WHERE kind = 'claim'
  AND status = 'pending';

UPDATE public.listings l
SET status = 'reserved'
WHERE l.status IN ('live', 'given')
  AND EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.listing_id = l.id
      AND o.kind = 'claim'
      AND o.status = 'accepted'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.listing_id = l.id
      AND o.kind = 'claim'
      AND o.status = 'completed'
  );

CREATE OR REPLACE FUNCTION public.claim_giveaway(p_listing_id bigint)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_offer_id bigint;
  v_buyer text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF public.current_profile_role() <> 'buyer' THEN
    RAISE EXCEPTION 'Only buyers can claim giveaways';
  END IF;

  PERFORM public.expire_overdue_borrows();
  PERFORM set_config('app.listing_rpc', 'on', true);

  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  IF v_listing.listing_type <> 'giveaway' THEN
    RAISE EXCEPTION 'This listing is not a giveaway';
  END IF;
  IF v_listing.status <> 'live' THEN
    RAISE EXCEPTION 'This giveaway is no longer available';
  END IF;
  IF v_listing.seller_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot claim your own listing';
  END IF;

  UPDATE public.listings
  SET status = 'reserved'
  WHERE id = p_listing_id AND status = 'live';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This giveaway is no longer available';
  END IF;

  INSERT INTO public.offers (listing_id, buyer_id, kind, status, detail)
  VALUES (p_listing_id, auth.uid(), 'claim', 'accepted', 'Claim: free')
  RETURNING id INTO v_offer_id;

  SELECT username INTO v_buyer FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_listing.seller_id,
    'Offer',
    'Giveaway claimed',
    format('@%s claimed “%s”. First claim won; the listing is reserved until they mark it complete.', v_buyer, v_listing.title),
    'bag',
    'gold',
    'View listing'
  );

  RETURN v_offer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_giveaway(bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_listing_price(p_listing_id bigint)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_offer_id bigint;
  v_buyer text;
  v_detail text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF public.current_profile_role() <> 'buyer' THEN
    RAISE EXCEPTION 'Only buyers can buy listings';
  END IF;

  PERFORM public.expire_overdue_borrows();
  PERFORM set_config('app.listing_rpc', 'on', true);
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  IF v_listing.status <> 'live' OR v_listing.listing_type <> 'sell' THEN
    RAISE EXCEPTION 'This listing is no longer available for purchase';
  END IF;
  IF v_listing.price IS NULL OR v_listing.price <= 0 THEN
    RAISE EXCEPTION 'This listing has no valid price';
  END IF;
  IF v_listing.seller_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot buy your own listing';
  END IF;

  v_detail := format('Offer: HK$%s', trim(to_char(v_listing.price, 'FM999999999990.00')));

  SELECT id INTO v_offer_id
  FROM public.offers
  WHERE listing_id = p_listing_id
    AND buyer_id = auth.uid()
    AND kind = 'offer'
    AND status IN ('pending', 'countered', 'declined')
  ORDER BY updated_at DESC
  FOR UPDATE
  LIMIT 1;

  IF v_offer_id IS NULL THEN
    INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, detail)
    VALUES (p_listing_id, auth.uid(), 'offer', 'accepted', v_listing.price, v_detail)
    RETURNING id INTO v_offer_id;
  ELSE
    UPDATE public.offers
    SET status = 'accepted',
        price = v_listing.price,
        detail = v_detail,
        completed_at = NULL
    WHERE id = v_offer_id;
  END IF;

  UPDATE public.offers
  SET status = 'declined',
      detail = coalesce(detail || ' · ', '') || 'Automatically declined because another request was accepted'
  WHERE listing_id = p_listing_id
    AND id <> v_offer_id
    AND status IN ('pending', 'countered');

  UPDATE public.listings SET status = 'reserved' WHERE id = p_listing_id;

  SELECT username INTO v_buyer FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_listing.seller_id, 'Offer', 'Listing purchased',
    format('@%s bought “%s” at the listed price. The listing is reserved until they mark the deal complete.', v_buyer, v_listing.title),
    'check', 'green', 'View listing'
  );
  RETURN v_offer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_listing_price(bigint) TO authenticated;

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
    IF v_offer.kind = 'claim' THEN
      RAISE EXCEPTION 'Claims cannot be countered';
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
      SET status = CASE WHEN v_offer.status = 'declined' AND v_is_seller
                        THEN 'pending'
                        ELSE 'countered'
                   END,
          price = p_counter_price,
          detail = v_detail
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
      SET status = CASE WHEN v_offer.status = 'declined' AND v_is_seller
                        THEN 'pending'
                        ELSE 'countered'
                   END,
          start_at = p_counter_start,
          end_at = p_counter_end,
          detail = v_detail
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
        format('@%s sent a new offer for “%s”. %s', v_actor, v_listing.title, v_detail),
        'inbox', 'gold', 'View deal'
      );
    END IF;
    RETURN;
  END IF;

  IF NOT v_is_seller AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the seller can accept or decline this request';
  END IF;
  IF v_offer.kind = 'claim' THEN
    RAISE EXCEPTION 'Giveaway claims are first-claim-wins and do not need seller acceptance';
  END IF;
  IF v_offer.status NOT IN ('pending', 'countered') THEN
    RAISE EXCEPTION 'This request is no longer pending';
  END IF;

  SELECT username INTO v_actor FROM public.profiles WHERE id = v_listing.seller_id;

  IF p_action = 'decline' THEN
    UPDATE public.offers SET status = 'declined' WHERE id = p_offer_id;
    PERFORM public.notify_user(
      v_offer.buyer_id, 'Offer', 'Offer declined',
      format('@%s declined your %s for “%s”.', v_actor, CASE v_offer.kind WHEN 'borrow' THEN 'borrow request' ELSE 'offer' END, v_listing.title),
      'x', 'red', 'View listing'
    );
    RETURN;
  END IF;

  v_next_listing_status := CASE v_offer.kind
    WHEN 'borrow' THEN 'lent'
    ELSE 'reserved'
  END;

  UPDATE public.offers
  SET status = 'accepted',
      completed_at = NULL
  WHERE id = p_offer_id;
  UPDATE public.offers
  SET status = 'declined',
      detail = coalesce(detail || ' · ', '') || 'Automatically declined because another request was accepted'
  WHERE listing_id = v_listing.id
    AND id <> p_offer_id
    AND status IN ('pending', 'countered');
  UPDATE public.listings SET status = v_next_listing_status WHERE id = v_listing.id;

  PERFORM public.notify_user(
    v_offer.buyer_id, 'Offer', 'Your offer was accepted',
    CASE WHEN v_offer.kind = 'borrow'
      THEN format('@%s accepted your borrow request for “%s”. Listing is now lent.', v_actor, v_listing.title)
      ELSE format('@%s accepted your offer for “%s”. Mark the deal complete on My Deals when you have the item.', v_actor, v_listing.title)
    END,
    'check', 'green', 'View deal'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_to_offer(bigint, text, numeric, timestamptz, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_counter_offer(p_offer_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
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
  IF v_offer.kind = 'claim' THEN
    RAISE EXCEPTION 'Giveaway claims are first-claim-wins and do not need seller acceptance';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id FOR UPDATE;
  IF v_listing.status <> 'live' THEN
    RAISE EXCEPTION 'This listing is no longer available';
  END IF;

  v_next_listing_status := CASE v_offer.kind
    WHEN 'borrow' THEN 'lent'
    ELSE 'reserved'
  END;

  PERFORM set_config('app.listing_rpc', 'on', true);
  UPDATE public.offers
  SET status = 'accepted',
      completed_at = NULL
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
    v_listing.seller_id, 'Offer', 'Counter offer accepted',
    format('@%s accepted your counter for “%s”. Listing is now %s until they mark the deal complete.', v_buyer, v_listing.title, v_next_listing_status),
    'check', 'green', 'View listing'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_counter_offer(bigint) TO authenticated;
