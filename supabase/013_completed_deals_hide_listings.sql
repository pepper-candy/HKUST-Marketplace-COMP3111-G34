-- Fix completed deals so their listings leave Browse immediately.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.complete_deal(
  p_offer_id bigint,
  p_stars integer DEFAULT NULL,
  p_review text DEFAULT NULL
)
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

  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;
  IF v_offer.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can complete this deal';
  END IF;
  IF v_offer.status NOT IN ('accepted', 'returned', 'completed') THEN
    RAISE EXCEPTION 'This deal cannot be completed yet';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id;
  PERFORM set_config('app.listing_rpc', 'on', true);

  IF v_offer.status <> 'completed' THEN
    UPDATE public.offers
    SET status = 'completed',
        completed_at = coalesce(completed_at, now()),
        detail = coalesce(detail || ' · ', '') || 'Buyer marked the deal complete'
    WHERE id = p_offer_id;

    IF v_offer.kind = 'offer' THEN
      UPDATE public.listings SET status = 'sold' WHERE id = v_listing.id;
    ELSIF v_offer.kind = 'claim' THEN
      UPDATE public.listings SET status = 'given' WHERE id = v_listing.id;
    ELSE
      -- A completed borrowing deal means the item is no longer being borrowed.
      UPDATE public.listings SET status = 'live' WHERE id = v_listing.id;
    END IF;

    SELECT username INTO v_buyer FROM public.profiles WHERE id = v_offer.buyer_id;
    PERFORM public.notify_user(
      v_listing.seller_id, 'Deal', 'Buyer marked a deal complete',
      format('@%s marked “%s” as complete.', v_buyer, v_listing.title),
      'check', 'green', 'View listing'
    );
  ELSE
    SELECT username INTO v_buyer FROM public.profiles WHERE id = v_offer.buyer_id;
  END IF;

  IF p_stars IS NOT NULL THEN
    IF p_stars < 1 OR p_stars > 5 THEN
      RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;
    INSERT INTO public.ratings (offer_id, buyer_id, seller_id, stars, review_text)
    VALUES (p_offer_id, v_offer.buyer_id, v_listing.seller_id, p_stars, NULLIF(p_review, ''))
    ON CONFLICT (offer_id) DO NOTHING;
    PERFORM public.notify_user(
      v_listing.seller_id, 'Rating', 'New rating received',
      format('@%s rated you %s/5 for “%s”.', v_buyer, p_stars, v_listing.title),
      'star', 'gold', 'View reviews'
    );
  END IF;
END;
$$;

-- Reconcile records that were completed before this fix was deployed.
DO $$
BEGIN
  PERFORM set_config('app.listing_rpc', 'on', true);

  UPDATE public.listings l
  SET status = CASE o.kind
    WHEN 'offer' THEN 'sold'
    WHEN 'claim' THEN 'given'
    ELSE 'live'
  END
  FROM public.offers o
  WHERE o.listing_id = l.id
    AND o.status = 'completed';
END;
$$;
