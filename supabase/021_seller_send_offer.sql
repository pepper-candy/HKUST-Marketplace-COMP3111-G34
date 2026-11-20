CREATE OR REPLACE FUNCTION public.seller_send_offer(
  p_offer_id bigint,
  p_price numeric DEFAULT NULL,
  p_start timestamptz DEFAULT NULL,
  p_end timestamptz DEFAULT NULL
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
  v_price_text text;
  v_seller text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id FOR UPDATE;
  IF v_listing.seller_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the seller can send this offer';
  END IF;
  IF v_listing.status <> 'live' THEN
    RAISE EXCEPTION 'This listing is no longer available';
  END IF;
  IF v_offer.status NOT IN ('declined', 'countered', 'pending') THEN
    RAISE EXCEPTION 'This offer is no longer available';
  END IF;

  IF v_offer.kind = 'offer' THEN
    IF p_price IS NULL OR p_price <= 0 THEN
      RAISE EXCEPTION 'Enter a valid offer amount';
    END IF;
    IF p_price = trunc(p_price) THEN
      v_price_text := trim(to_char(p_price, 'FM999999999990'));
    ELSE
      v_price_text := trim(to_char(p_price, 'FM999999999990.00'));
    END IF;
    v_detail := format('Offer: HK$%s', v_price_text);
    UPDATE public.offers
    SET status = 'countered', price = p_price, detail = v_detail
    WHERE id = p_offer_id;
  ELSE
    IF p_start IS NULL OR p_end IS NULL OR p_end < p_start + interval '5 seconds' THEN
      RAISE EXCEPTION 'Choose a valid lending period of at least 5 seconds';
    END IF;
    v_detail := format(
      'Borrow request: %s → %s',
      to_char(p_start AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am'),
      to_char(p_end AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am')
    );
    UPDATE public.offers
    SET status = 'countered', start_at = p_start, end_at = p_end, detail = v_detail
    WHERE id = p_offer_id;
  END IF;

  SELECT username INTO v_seller FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_offer.buyer_id,
    'Offer',
    'Seller sent a new offer',
    format('@%s sent a new offer for “%s”. %s', v_seller, v_listing.title, v_detail),
    'bag',
    'gold',
    'View deal'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.seller_send_offer(bigint, numeric, timestamptz, timestamptz) TO authenticated;
