-- Let a buyer accept the listed price without creating a pending offer.
-- Run after 013_completed_deals_hide_listings.sql.

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

  INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, detail)
  VALUES (p_listing_id, auth.uid(), 'offer', 'accepted', v_listing.price,
          format('Offer: HK$%s', trim(to_char(v_listing.price, 'FM999999999990.00'))))
  RETURNING id INTO v_offer_id;

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
    format('@%s bought “%s” at the listed price. Listing is now reserved.', v_buyer, v_listing.title),
    'check', 'green', 'View listing'
  );
  RETURN v_offer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_listing_price(bigint) TO authenticated;
