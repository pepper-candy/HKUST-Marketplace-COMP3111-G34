-- Run this once in the Supabase SQL Editor (same way as the other supabase/*.sql files).
-- Follow-up after 001–011. Do not re-run 001.
-- When a buyer opens an empty chat, seed a seller welcome plus the listing terms
-- (price / lending period / giveaway claim) so they can accept right away.
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
  v_offer_id bigint;
  v_offer_status text;
  v_offer_detail text;
  v_offer_kind text;
  v_welcome text;
  v_price_text text;
  v_start timestamptz;
  v_end timestamptz;
  v_duration interval;
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
      'Hi! Thanks for your interest in “%s”. Happy to meet on campus whenever it suits you. The listed price is below — you can accept it now, or send an offer if you had another number in mind.',
      v_listing.title
    );
  ELSIF v_listing.listing_type = 'lend' THEN
    v_welcome := format(
      'Hi! Thanks for your interest in “%s”. You are welcome to borrow it. The default lending period is below — accept it now, or propose different dates.',
      v_listing.title
    );
  ELSE
    v_welcome := format(
      'Hi! Thanks for your interest in “%s”. This is a giveaway. Claim it below and we can arrange a quick campus meetup.',
      v_listing.title
    );
  END IF;

  PERFORM set_config('app.skip_chat_notify', 'on', true);

  INSERT INTO public.chat_messages (thread_id, sender_id, body, kind)
  VALUES (v_thread_id, v_listing.seller_id, v_welcome, 'message');

  SELECT o.id, o.status, o.detail, o.kind
  INTO v_offer_id, v_offer_status, v_offer_detail, v_offer_kind
  FROM public.offers o
  WHERE o.listing_id = p_listing_id
    AND o.buyer_id = v_buyer
    AND o.status IN ('pending', 'countered')
  ORDER BY CASE WHEN o.status = 'countered' THEN 0 ELSE 1 END, o.updated_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_listing.listing_type = 'giveaway' THEN
    IF v_offer_id IS NULL THEN
      INSERT INTO public.chat_messages (thread_id, sender_id, body, kind)
      VALUES (v_thread_id, v_listing.seller_id, 'Claim: free', 'offer');
    ELSE
      INSERT INTO public.chat_messages (thread_id, sender_id, body, kind, offer_id)
      VALUES (
        v_thread_id,
        v_listing.seller_id,
        coalesce(v_offer_detail, 'Claim: free'),
        'offer',
        v_offer_id
      );
    END IF;
  ELSE
    INSERT INTO public.chat_messages (thread_id, sender_id, body, kind, offer_id)
    VALUES (
      v_thread_id,
      v_listing.seller_id,
      coalesce(v_offer_detail, 'Offer'),
      'offer',
      v_offer_id
    );
  END IF;

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
