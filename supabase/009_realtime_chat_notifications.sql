-- Run this once in the Supabase SQL Editor (same way as the other supabase/*.sql files).
-- Follow-up after 001–008. Do not re-run 001.
-- Adds public.notifications and public.chat_messages to supabase_realtime
-- so signed-in clients can receive new chat rows and notifications without polling.
-- Safe to re-run (skips a table if it is already in the publication).
-- Also enable Realtime in the Supabase Dashboard if the supabase_realtime
-- publication is off for this project (Database → Publications).

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
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END
$$;
