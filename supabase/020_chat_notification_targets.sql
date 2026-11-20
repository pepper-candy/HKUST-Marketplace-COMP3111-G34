-- Add exact chat targets to notifications so "Open chat" never falls back to
-- whichever listing/chat is currently latest for the same user pair.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS listing_id bigint REFERENCES public.listings (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS thread_id bigint REFERENCES public.chat_threads (id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id uuid,
  p_category text,
  p_title text,
  p_message text,
  p_icon text DEFAULT 'bell',
  p_tone text DEFAULT 'navy',
  p_action text DEFAULT NULL,
  p_listing_id bigint DEFAULT NULL,
  p_thread_id bigint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.notifications (
    user_id, category, title, message, icon, tone, action, listing_id, thread_id
  )
  VALUES (
    p_user_id, p_category, p_title, p_message, p_icon, p_tone,
    p_action, p_listing_id, p_thread_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.on_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread public.chat_threads%ROWTYPE;
  v_recipient uuid;
  v_sender text;
BEGIN
  IF current_setting('app.skip_chat_notify', true) = 'on' THEN
    RETURN NEW;
  END IF;
  SELECT * INTO v_thread FROM public.chat_threads WHERE id = NEW.thread_id;
  v_recipient := CASE
    WHEN NEW.sender_id = v_thread.buyer_id THEN v_thread.seller_id
    ELSE v_thread.buyer_id
  END;
  SELECT username INTO v_sender FROM public.profiles WHERE id = NEW.sender_id;
  PERFORM public.notify_user(
    v_recipient,
    'Chat',
    format('New message from @%s', v_sender),
    left(NEW.body, 180),
    'message',
    'navy',
    'Open chat',
    v_thread.listing_id,
    v_thread.id
  );
  RETURN NEW;
END;
$$;
