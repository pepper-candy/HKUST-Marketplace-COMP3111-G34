-- Additive fix for an already-applied 001_schema.sql.
-- Dashboard SQL Editor → paste this file → Run.
-- Do not re-run 001 (CREATE TABLE would fail / is not needed).

BEGIN;

CREATE OR REPLACE FUNCTION public.owns_listing(p_listing_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings
    WHERE id = p_listing_id
      AND seller_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_offer_on_listing(p_listing_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offers
    WHERE listing_id = p_listing_id
      AND buyer_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS listings_select ON public.listings;
CREATE POLICY listings_select ON public.listings
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR seller_id = auth.uid()
    OR status = 'live'
    OR public.has_offer_on_listing(id)
  );

DROP POLICY IF EXISTS offers_select ON public.offers;
CREATE POLICY offers_select ON public.offers
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR buyer_id = auth.uid()
    OR public.owns_listing(listing_id)
  );

GRANT EXECUTE ON FUNCTION public.owns_listing(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_offer_on_listing(bigint) TO authenticated;

COMMIT;
