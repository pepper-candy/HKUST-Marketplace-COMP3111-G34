-- Report notification includes the written reason on a new line.
-- Rejecting a report dismisses it only; the listing is not pulled back.
-- Safe to re-run.

ALTER TABLE public.listing_reports
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

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

  INSERT INTO public.listing_reports (listing_id, reporter_id, reason, resolved_at)
  VALUES (p_listing_id, auth.uid(), v_reason, NULL)
  ON CONFLICT (listing_id, reporter_id) DO UPDATE
    SET reason = excluded.reason,
        resolved_at = NULL;

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

CREATE OR REPLACE FUNCTION public.dismiss_listing_reports(p_listing_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE public.listing_reports
  SET resolved_at = coalesce(resolved_at, now())
  WHERE listing_id = p_listing_id
    AND resolved_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dismiss_listing_reports(bigint) TO authenticated;
