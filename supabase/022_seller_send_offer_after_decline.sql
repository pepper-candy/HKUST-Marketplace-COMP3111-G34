-- Lets a seller make a new offer after the buyer declined the previous one.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.seller_make_offer_after_decline(
  p_offer_id bigint,
  p_price numeric DEFAULT NULL,
  p_start_at timestamptz DEFAULT NULL,
  p_end_at timestamptz DEFAULT NULL
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
  v_actor text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_offer
  FROM public.offers
  WHERE id = p_offer_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = v_offer.listing_id
  FOR UPDATE;

  IF v_listing.seller_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the seller can send a new offer';
  END IF;
  IF v_offer.status <> 'declined' THEN
    RAISE EXCEPTION 'This request is not declined';
  END IF;
  IF v_listing.status <> 'live' THEN
    RAISE EXCEPTION 'This listing is no longer available';
  END IF;
  IF v_offer.kind = 'claim' THEN
    RAISE EXCEPTION 'Claims cannot be countered';
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
    SET status = 'pending', price = p_price, detail = v_detail
    WHERE id = p_offer_id;
  ELSE
    IF p_start_at IS NULL OR p_end_at IS NULL
      OR p_end_at < p_start_at + interval '5 seconds' THEN
      RAISE EXCEPTION 'Choose a valid lending period of at least 5 seconds';
    END IF;
    v_detail := format(
      'Borrow request: %s → %s',
      to_char(p_start_at AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am'),
      to_char(p_end_at AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am')
    );
    UPDATE public.offers
    SET status = 'pending', start_at = p_start_at, end_at = p_end_at, detail = v_detail
    WHERE id = p_offer_id;
  END IF;

  SELECT username INTO v_actor
  FROM public.profiles
  WHERE id = v_listing.seller_id;
  PERFORM public.notify_user(
    v_offer.buyer_id, 'Offer', 'Seller sent a new offer',
    format('@%s sent a new offer for “%s”. %s', v_actor, v_listing.title, v_detail),
    'inbox', 'gold', 'View deal'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.seller_make_offer_after_decline(bigint, numeric, timestamptz, timestamptz)
  TO authenticated;
