-- Independent report cases: one card per report (pending or closed).
-- Review / reject a report never pulls the listing back.
-- Safe to re-run.

ALTER TABLE public.listing_reports
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

ALTER TABLE public.listing_reports
  ADD COLUMN IF NOT EXISTS resolution text;

ALTER TABLE public.listing_reports
  DROP CONSTRAINT IF EXISTS listing_reports_listing_id_reporter_id_key;

ALTER TABLE public.listing_reports
  DROP CONSTRAINT IF EXISTS listing_reports_resolution_check;

ALTER TABLE public.listing_reports
  ADD CONSTRAINT listing_reports_resolution_check
  CHECK (resolution IS NULL OR resolution IN ('reviewed', 'dismissed'));

UPDATE public.listing_reports
SET resolution = 'dismissed',
    resolved_at = coalesce(resolved_at, now())
WHERE resolved_at IS NOT NULL
  AND resolution IS NULL;

CREATE OR REPLACE FUNCTION public.report_listing(
  p_listing_id bigint,
  p_reason text DEFAULT 'Inappropriate or unsafe listing'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_reporter text;
  v_reason text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_reason := coalesce(NULLIF(trim(p_reason), ''), 'Inappropriate or unsafe listing');

  INSERT INTO public.listing_reports (listing_id, reporter_id, reason, resolved_at, resolution)
  VALUES (p_listing_id, auth.uid(), v_reason, NULL, NULL);

  SELECT title INTO v_title FROM public.listings WHERE id = p_listing_id;
  SELECT username INTO v_reporter FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_admins(
    'Report',
    'Reported listing requires moderation',
    format('@%s reported “%s”.%s%s', v_reporter, v_title, E'\n', v_reason),
    'x',
    'red',
    'Review listing'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.report_listing(bigint, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_listing_report(
  p_report_id bigint,
  p_resolution text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF p_resolution NOT IN ('reviewed', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid report resolution';
  END IF;

  UPDATE public.listing_reports
  SET resolution = p_resolution,
      resolved_at = coalesce(resolved_at, now())
  WHERE id = p_report_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_listing_report(bigint, text) TO authenticated;
