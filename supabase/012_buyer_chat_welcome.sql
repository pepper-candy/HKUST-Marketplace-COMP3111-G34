-- Run this once in the Supabase SQL Editor (same way as the other supabase/*.sql files).
-- Follow-up after 001–011. Do not re-run 001.
-- When a buyer opens an empty chat, seed a seller welcome message only.
-- Safe to re-run.

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
  v_title text;
BEGIN
  IF current_setting('app.skip_chat_notify', true) = 'on' THEN
    RETURN NEW;
  END IF;
  SELECT * INTO v_thread FROM public.chat_threads WHERE id = NEW.thread_id;
  v_recipient := CASE WHEN NEW.sender_id = v_thread.buyer_id THEN v_thread.seller_id ELSE v_thread.buyer_id END;
  SELECT username INTO v_sender FROM public.profiles WHERE id = NEW.sender_id;
  SELECT title INTO v_title FROM public.listings WHERE id = v_thread.listing_id;
  PERFORM public.notify_user(
    v_recipient,
    'Chat',
    format('New message from @%s', v_sender),
    left(NEW.body, 180),
    'message',
    'navy',
    'Open chat'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.open_chat_thread(p_listing_id bigint, p_buyer_id uuid DEFAULT NULL)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_buyer uuid;
  v_thread_id bigint;
  v_role text := public.current_profile_role();
  v_welcome text;
  v_buyer_name text;
  v_has_messages boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_role = 'buyer' THEN
    v_buyer := auth.uid();
  ELSIF v_role = 'seller' AND v_listing.seller_id = auth.uid() THEN
    v_buyer := p_buyer_id;
  ELSIF public.is_admin() THEN
    v_buyer := coalesce(p_buyer_id, auth.uid());
  ELSE
    RAISE EXCEPTION 'You cannot open this chat';
  END IF;

  IF v_buyer IS NULL THEN
    RAISE EXCEPTION 'Buyer is required to open this chat';
  END IF;

  SELECT id INTO v_thread_id
  FROM public.chat_threads
  WHERE listing_id = p_listing_id AND buyer_id = v_buyer
  FOR UPDATE;

  IF v_thread_id IS NULL THEN
    BEGIN
      INSERT INTO public.chat_threads (listing_id, buyer_id, seller_id)
      VALUES (p_listing_id, v_buyer, v_listing.seller_id)
      RETURNING id INTO v_thread_id;
    EXCEPTION
      WHEN unique_violation THEN
        SELECT id INTO v_thread_id
        FROM public.chat_threads
        WHERE listing_id = p_listing_id AND buyer_id = v_buyer
        FOR UPDATE;
    END;
  END IF;

  IF v_role <> 'buyer' OR v_listing.status <> 'live' THEN
    RETURN v_thread_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.chat_messages WHERE thread_id = v_thread_id
  ) INTO v_has_messages;
  IF v_has_messages THEN
    RETURN v_thread_id;
  END IF;

  IF v_listing.listing_type = 'sell' THEN
    v_welcome := format(
      'Hi! Thanks for your interest in “%s”. Happy to meet on campus whenever it suits you. Send an offer when you are ready to start the deal.',
      v_listing.title
    );
  ELSIF v_listing.listing_type = 'lend' THEN
    v_welcome := format(
      'Hi! Thanks for your interest in “%s”. You are welcome to borrow it. Send a borrow request when you are ready to start the deal.',
      v_listing.title
    );
  ELSE
    v_welcome := format(
      'Hi! Thanks for your interest in “%s”. This is a giveaway. Send a claim request when you are ready to start the deal.',
      v_listing.title
    );
  END IF;

  PERFORM set_config('app.skip_chat_notify', 'on', true);

  INSERT INTO public.chat_messages (thread_id, sender_id, body, kind)
  VALUES (v_thread_id, v_listing.seller_id, v_welcome, 'message');

  PERFORM set_config('app.skip_chat_notify', '', true);

  SELECT username INTO v_buyer_name FROM public.profiles WHERE id = v_buyer;
  PERFORM public.notify_user(
    v_listing.seller_id,
    'Chat',
    format('New chat from @%s', v_buyer_name),
    format('@%s started a conversation about “%s”.', v_buyer_name, v_listing.title),
    'message',
    'navy',
    'Open chat'
  );

  RETURN v_thread_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.open_chat_thread(bigint, uuid) TO authenticated;

-- Buyer Accept on a seller-proposed / countered offer (listing price in chat, or a later counter).
CREATE OR REPLACE FUNCTION public.accept_counter_offer(p_offer_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_next_listing_status text;
  v_buyer text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  IF v_offer.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can accept this counter offer';
  END IF;
  IF v_offer.status <> 'countered' THEN
    RAISE EXCEPTION 'This counter offer is no longer available';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id FOR UPDATE;
  IF v_listing.status <> 'live' THEN
    RAISE EXCEPTION 'This listing is no longer available';
  END IF;

  v_next_listing_status := CASE v_offer.kind
    WHEN 'offer' THEN 'reserved'
    WHEN 'borrow' THEN 'lent'
    ELSE 'given'
  END;

  PERFORM set_config('app.listing_rpc', 'on', true);
  UPDATE public.offers SET status = 'accepted' WHERE id = p_offer_id;
  UPDATE public.offers
  SET status = 'declined',
      detail = coalesce(detail || ' · ', '') || 'Automatically declined because another request was accepted'
  WHERE listing_id = v_listing.id
    AND id <> p_offer_id
    AND status IN ('pending', 'countered');
  UPDATE public.listings SET status = v_next_listing_status WHERE id = v_listing.id;

  SELECT username INTO v_buyer FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_listing.seller_id, 'Offer', 'Counter offer accepted',
    format('@%s accepted your counter for “%s”. Listing is now %s.', v_buyer, v_listing.title, v_next_listing_status),
    'check', 'green', 'View listing'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_counter_offer(bigint) TO authenticated;
