-- Hide a chat from the signed-in buyer's or seller's inbox.
-- Messages stay in the database and remain searchable. Run 026_canvas_gaps.sql
-- on databases that already applied an older DELETE version of this file.

ALTER TABLE public.chat_threads
  ADD COLUMN IF NOT EXISTS buyer_hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS seller_hidden_at timestamptz;

CREATE OR REPLACE FUNCTION public.hide_chat_thread(p_thread_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread public.chat_threads%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_thread
  FROM public.chat_threads
  WHERE id = p_thread_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chat not found';
  END IF;

  IF v_thread.buyer_id = auth.uid() THEN
    UPDATE public.chat_threads
    SET buyer_hidden_at = coalesce(buyer_hidden_at, now())
    WHERE id = p_thread_id;
  ELSIF v_thread.seller_id = auth.uid() THEN
    UPDATE public.chat_threads
    SET seller_hidden_at = coalesce(seller_hidden_at, now())
    WHERE id = p_thread_id;
  ELSIF public.is_admin() THEN
    UPDATE public.chat_threads
    SET
      buyer_hidden_at = coalesce(buyer_hidden_at, now()),
      seller_hidden_at = coalesce(seller_hidden_at, now())
    WHERE id = p_thread_id;
  ELSE
    RAISE EXCEPTION 'You cannot hide this chat';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_chat_thread(p_thread_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.hide_chat_thread(p_thread_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.hide_chat_thread(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_chat_thread(bigint) TO authenticated;
REVOKE DELETE ON public.chat_threads FROM authenticated;
DROP POLICY IF EXISTS threads_delete ON public.chat_threads;
