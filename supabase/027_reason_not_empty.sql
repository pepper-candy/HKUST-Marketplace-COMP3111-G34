-- Follow-on after 026. Canvas Task 3.2 / 2.7 / 3.7: written non-empty reason only.
-- Drops the extra 10-character floor on admin reject / take-down.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.moderate_listing(
  p_listing_id bigint,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_offer record;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF p_action NOT IN ('approve', 'reject', 'remove') THEN
    RAISE EXCEPTION 'Invalid moderation action';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  PERFORM set_config('app.listing_rpc', 'on', true);

  IF p_action = 'approve' THEN
    UPDATE public.listings
    SET status = 'live', rejection_reason = NULL
    WHERE id = p_listing_id;
    PERFORM public.notify_user(
      v_listing.seller_id, 'Listing review', 'Listing approved',
      format('“%s” is now live on the marketplace.', v_listing.title),
      'check', 'green', 'View listing'
    );
    RETURN;
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'Provide a written reason';
  END IF;

  IF p_action = 'reject' THEN
    UPDATE public.listings
    SET status = 'rejected', rejection_reason = trim(p_reason)
    WHERE id = p_listing_id;
    PERFORM public.notify_user(
      v_listing.seller_id, 'Listing review', 'Listing rejected',
      format('“%s” was rejected. Reason: %s', v_listing.title, trim(p_reason)),
      'x', 'red', 'View listing'
    );
    RETURN;
  END IF;

  UPDATE public.listings
  SET status = 'removed', removed_reason = trim(p_reason)
  WHERE id = p_listing_id;

  UPDATE public.offers
  SET status = 'cancelled',
      detail = coalesce(detail || ' · ', '') || 'Listing removed by admin'
  WHERE listing_id = p_listing_id
    AND status IN ('pending', 'countered', 'accepted');

  PERFORM public.notify_user(
    v_listing.seller_id, 'Listing', 'Listing taken down',
    format('An admin removed “%s”. Reason: %s', v_listing.title, trim(p_reason)),
    'grid', 'red', 'View listing'
  );

  FOR v_offer IN
    SELECT DISTINCT buyer_id
    FROM public.offers
    WHERE listing_id = p_listing_id
  LOOP
    PERFORM public.notify_user(
      v_offer.buyer_id, 'Listing', 'A listing you offered on was removed',
      format('An admin removed “%s”. Active offers on that listing were closed.', v_listing.title),
      'grid', 'red', 'View deals'
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.moderate_listing(bigint, text, text) TO authenticated;
