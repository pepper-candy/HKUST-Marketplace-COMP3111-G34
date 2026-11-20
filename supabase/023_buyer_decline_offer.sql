-- Lets a buyer decline an ordinary offer or seller counter.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.buyer_decline_offer(p_offer_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_buyer text;
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
  IF v_offer.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can decline this offer';
  END IF;
  IF v_offer.status NOT IN ('pending', 'countered') THEN
    RAISE EXCEPTION 'This offer is no longer available';
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = v_offer.listing_id
  FOR UPDATE;

  UPDATE public.offers
  SET status = 'declined'
  WHERE id = p_offer_id;

  SELECT username INTO v_buyer
  FROM public.profiles
  WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_listing.seller_id,
    'Offer',
    'Offer declined',
    format('@%s declined the offer for “%s”.', v_buyer, v_listing.title),
    'x',
    'red',
    'View listing'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buyer_decline_offer(bigint) TO authenticated;
