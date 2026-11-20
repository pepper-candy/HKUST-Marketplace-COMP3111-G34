-- Dedicated buyer counter RPC. Run once in the Supabase SQL Editor.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.buyer_counter_offer(
  p_offer_id bigint,
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
  v_detail text;
  v_buyer text;
  v_price_text text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  IF v_offer.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can counter this offer';
  END IF;
  IF v_offer.status <> 'countered' THEN
    RAISE EXCEPTION 'This seller counter is no longer available';
  END IF;
  IF v_offer.kind = 'claim' THEN
    RAISE EXCEPTION 'Claims cannot be countered';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id FOR UPDATE;
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
    SET status = 'countered', price = p_counter_price, detail = v_detail
    WHERE id = p_offer_id;
  ELSE
    IF p_counter_start IS NULL OR p_counter_end IS NULL
      OR p_counter_end < p_counter_start + interval '5 seconds' THEN
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

  SELECT username INTO v_buyer FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_listing.seller_id, 'Offer', 'Buyer sent a counter',
    format('@%s countered for “%s”. %s', v_buyer, v_listing.title, v_detail),
    'inbox', 'gold', 'View listing'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buyer_counter_offer(bigint, numeric, timestamptz, timestamptz) TO authenticated;
