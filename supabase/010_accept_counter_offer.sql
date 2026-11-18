-- Allow buyers to accept a seller counter offer before completing the deal.
-- Run after 001–009.

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

GRANT EXECUTE ON FUNCTION public.accept_counter_offer(bigint) TO authenticated;
