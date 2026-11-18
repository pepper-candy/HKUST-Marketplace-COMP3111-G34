-- Run this once in the Supabase SQL Editor (same way as the other supabase/*.sql files).
-- Follow-up after 001–012. Do not re-run 001.
-- Live updates for notifications + offers (chat, Offers / Requests, My Deals).
-- Browse marketplace is NOT live: buyers refresh listings with the Browse button
-- so a flood of new posts does not rearrange the grid. Do not add public.listings
-- to supabase_realtime.
-- REPLICA IDENTITY FULL lets UPDATE events pass RLS filters.
-- Safe to re-run.

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.offers REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
  END IF;
END
$$;
