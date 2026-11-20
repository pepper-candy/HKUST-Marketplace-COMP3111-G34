-- Run once in the Supabase SQL Editor after 012–014.
-- Deletes a chat only when it belongs to the signed-in buyer or seller.

CREATE OR REPLACE FUNCTION public.delete_chat_thread(p_thread_id bigint)
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

  IF v_thread.buyer_id <> auth.uid()
     AND v_thread.seller_id <> auth.uid()
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You cannot delete this chat';
  END IF;

  DELETE FROM public.chat_threads WHERE id = p_thread_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_chat_thread(bigint) TO authenticated;

-- RLS-backed fallback for environments that call table deletion directly.
GRANT DELETE ON public.chat_threads TO authenticated;

DROP POLICY IF EXISTS threads_delete ON public.chat_threads;
CREATE POLICY threads_delete ON public.chat_threads
  FOR DELETE
  TO authenticated
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR public.is_admin()
  );
