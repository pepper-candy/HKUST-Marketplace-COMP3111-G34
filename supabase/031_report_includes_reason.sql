-- Report notification includes the reporter’s written reason on a new line.
-- Safe to re-run.

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

  INSERT INTO public.listing_reports (listing_id, reporter_id, reason)
  VALUES (p_listing_id, auth.uid(), v_reason)
  ON CONFLICT (listing_id, reporter_id) DO UPDATE SET reason = excluded.reason;

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
