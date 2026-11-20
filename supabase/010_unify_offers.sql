-- Run this once in the Supabase SQL Editor (same way as the other supabase/*.sql files).
-- Follow-up after 001–009. Do not re-run 001.
-- One pending/countered offer per buyer+listing (sell/lend). Listing Detail and
-- chat Formal Make Offer both create or update that same public.offers row.
-- Unified labels: "Offer: HK$…" / "Borrow request: …". Claims / giveaways unchanged.
-- Safe to re-run.

-- Close duplicate open sell/lend offers so the unique index can be created.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY listing_id, buyer_id
      ORDER BY updated_at DESC, id DESC
    ) AS rn
  FROM public.offers
  WHERE status IN ('pending', 'countered')
    AND kind IN ('offer', 'borrow')
)
UPDATE public.offers o
SET
  status = 'declined',
  detail = coalesce(o.detail || ' · ', '') || 'Closed as duplicate of a later offer'
FROM ranked
WHERE o.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS offers_one_open_per_buyer
  ON public.offers (listing_id, buyer_id)
  WHERE status IN ('pending', 'countered')
    AND kind IN ('offer', 'borrow');

UPDATE public.offers
SET detail = regexp_replace(detail, '^Proposed price:', 'Offer:')
WHERE detail LIKE 'Proposed price:%';

UPDATE public.offers
SET detail = regexp_replace(detail, '^Seller counter:', 'Offer:')
WHERE kind = 'offer'
  AND detail LIKE 'Seller counter:%';

UPDATE public.offers
SET detail = regexp_replace(detail, '^Seller proposed new lending dates:', 'Borrow request:')
WHERE kind = 'borrow'
  AND detail LIKE 'Seller proposed new lending dates:%';

UPDATE public.chat_messages
SET body = regexp_replace(body, '^Formal offer:\s*', 'Offer: ', 'i')
WHERE kind = 'offer'
  AND body ~* '^Formal offer:';

UPDATE public.chat_messages
SET body = regexp_replace(body, '^Formal counter:\s*', 'Offer: ', 'i')
WHERE kind = 'offer'
  AND body ~* '^Formal counter:\s*HK\$';

UPDATE public.chat_messages
SET body = regexp_replace(body, '^Formal counter:\s*', 'Borrow request: ', 'i')
WHERE kind = 'offer'
  AND body ~* '^Formal counter:'
  AND body !~* 'HK\$';

UPDATE public.chat_messages
SET body = regexp_replace(body, '^Proposed price:\s*', 'Offer: ', 'i')
WHERE kind = 'offer'
  AND body ~* '^Proposed price:';

UPDATE public.chat_messages m
SET offer_id = s.offer_id
FROM (
  SELECT
    t.id AS thread_id,
    (
      SELECT o.id
      FROM public.offers o
      WHERE o.listing_id = t.listing_id
        AND o.buyer_id = t.buyer_id
        AND o.kind IN ('offer', 'borrow')
      ORDER BY
        CASE WHEN o.status IN ('pending', 'countered') THEN 0 ELSE 1 END,
        o.updated_at DESC,
        o.id DESC
      LIMIT 1
    ) AS offer_id
  FROM public.chat_threads t
) s
WHERE m.thread_id = s.thread_id
  AND m.kind = 'offer'
  AND m.offer_id IS NULL
  AND s.offer_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_offer(
  p_listing_id bigint,
  p_kind text,
  p_price numeric DEFAULT NULL,
  p_start_at timestamptz DEFAULT NULL,
  p_end_at timestamptz DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_offer_id bigint;
  v_detail text;
  v_buyer text;
  v_price_text text;
  v_updated boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_kind NOT IN ('offer', 'borrow') THEN
    RAISE EXCEPTION 'Use claim_giveaway for giveaway items';
  END IF;
  IF public.current_profile_role() <> 'buyer' THEN
    RAISE EXCEPTION 'Only buyers can submit offers';
  END IF;

  PERFORM public.expire_overdue_borrows();
  PERFORM set_config('app.listing_rpc', 'on', true);

  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  IF v_listing.status <> 'live' THEN
    RAISE EXCEPTION 'This listing is no longer available';
  END IF;
  IF v_listing.seller_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot act on your own listing';
  END IF;
  IF p_kind = 'offer' AND v_listing.listing_type <> 'sell' THEN
    RAISE EXCEPTION 'This listing is not for sale';
  END IF;
  IF p_kind = 'borrow' AND v_listing.listing_type <> 'lend' THEN
    RAISE EXCEPTION 'This listing is not for lending';
  END IF;
  IF p_kind = 'offer' AND (p_price IS NULL OR p_price <= 0) THEN
    RAISE EXCEPTION 'Enter a valid offer amount';
  END IF;
  IF p_kind = 'borrow' THEN
    IF p_start_at IS NULL OR p_end_at IS NULL THEN
      RAISE EXCEPTION 'Choose both a start and end date';
    END IF;
    IF p_end_at < p_start_at + interval '5 seconds' THEN
      RAISE EXCEPTION 'End time must be at least 5 seconds after the start time';
    END IF;
  END IF;

  IF p_kind = 'offer' THEN
    IF p_price = trunc(p_price) THEN
      v_price_text := trim(to_char(p_price, 'FM999999999990'));
    ELSE
      v_price_text := trim(to_char(p_price, 'FM999999999990.00'));
    END IF;
    v_detail := format('Offer: HK$%s', v_price_text);
  ELSE
    v_detail := format(
      'Borrow request: %s → %s',
      to_char(p_start_at AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am'),
      to_char(p_end_at AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am')
    );
  END IF;

  SELECT id INTO v_offer_id
  FROM public.offers
  WHERE listing_id = p_listing_id
    AND buyer_id = auth.uid()
    AND kind = p_kind
    AND status IN ('pending', 'countered')
  FOR UPDATE;

  IF v_offer_id IS NOT NULL THEN
    UPDATE public.offers
    SET
      status = 'pending',
      price = p_price,
      start_at = p_start_at,
      end_at = p_end_at,
      detail = v_detail
    WHERE id = v_offer_id;
    v_updated := true;
  ELSE
    BEGIN
      INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail)
      VALUES (p_listing_id, auth.uid(), p_kind, 'pending', p_price, p_start_at, p_end_at, v_detail)
      RETURNING id INTO v_offer_id;
    EXCEPTION
      WHEN unique_violation THEN
        UPDATE public.offers
        SET
          status = 'pending',
          price = p_price,
          start_at = p_start_at,
          end_at = p_end_at,
          detail = v_detail
        WHERE listing_id = p_listing_id
          AND buyer_id = auth.uid()
          AND kind = p_kind
          AND status IN ('pending', 'countered')
        RETURNING id INTO v_offer_id;
        IF v_offer_id IS NULL THEN
          RAISE;
        END IF;
        v_updated := true;
    END;
  END IF;

  SELECT username INTO v_buyer FROM public.profiles WHERE id = auth.uid();
  IF v_updated THEN
    PERFORM public.notify_user(
      v_listing.seller_id,
      'Offer',
      CASE WHEN p_kind = 'offer' THEN 'Offer updated' ELSE 'Borrow request updated' END,
      format('@%s updated their %s on “%s”. %s', v_buyer, CASE WHEN p_kind = 'offer' THEN 'offer' ELSE 'borrow request' END, v_listing.title, v_detail),
      'bag',
      'gold',
      'Review request'
    );
  ELSE
    PERFORM public.notify_user(
      v_listing.seller_id,
      'Offer',
      CASE WHEN p_kind = 'offer' THEN 'New offer received' ELSE 'New borrow request' END,
      format('@%s submitted a %s on “%s”. %s', v_buyer, CASE WHEN p_kind = 'offer' THEN 'offer' ELSE 'borrow request' END, v_listing.title, v_detail),
      'bag',
      'gold',
      'Review request'
    );
  END IF;

  RETURN v_offer_id;
END;
$$;

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
    IF v_offer.status NOT IN ('pending', 'countered') THEN
      RAISE EXCEPTION 'This request is no longer pending';
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

  v_next_listing_status := CASE v_offer.kind
    WHEN 'offer' THEN 'reserved'
    WHEN 'borrow' THEN 'lent'
    ELSE 'given'
  END;

  UPDATE public.offers SET status = 'accepted' WHERE id = p_offer_id;
  UPDATE public.offers
  SET status = 'declined',
      detail = coalesce(detail || ' · ', '') || 'Automatically declined because another request was accepted'
  WHERE listing_id = v_listing.id
    AND id <> p_offer_id
    AND status IN ('pending', 'countered');

  UPDATE public.listings SET status = v_next_listing_status WHERE id = v_listing.id;

  PERFORM public.notify_user(
    v_offer.buyer_id, 'Offer', 'Your offer was accepted',
    format('@%s accepted your %s for “%s”. Listing is now %s.', v_actor, CASE v_offer.kind WHEN 'borrow' THEN 'borrow request' WHEN 'claim' THEN 'claim' ELSE 'offer' END, v_listing.title, v_next_listing_status),
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

  v_next_listing_status := CASE v_offer.kind
    WHEN 'offer' THEN 'reserved'
    WHEN 'borrow' THEN 'lent'
    ELSE 'given'
  END;

  PERFORM set_config('app.listing_rpc', 'on', true);
  UPDATE public.offers SET status = 'accepted' WHERE id = p_offer_id;
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
    format('@%s accepted your counter for “%s”. Listing is now %s.', v_buyer, v_listing.title, v_next_listing_status),
    'check', 'green', 'View listing'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_offer(bigint, text, numeric, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_offer(bigint, text, numeric, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_counter_offer(bigint) TO authenticated;
