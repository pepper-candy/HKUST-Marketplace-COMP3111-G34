-- Combined 015–025 for an existing database that already has 001–014 applied.
-- Paste into Supabase Dashboard → SQL Editor → Run.
--
-- Do NOT re-run 001–014.
-- Do NOT re-run 010 or 012: git updated those files as canonical copies, but the
-- live-function changes are already included below (018 / 020 / 021 / 024).
--
-- Intermediate copies of respond_to_offer from 016 and 018 are omitted; 021 is
-- the final version. Safe to re-run: CREATE OR REPLACE / IF NOT EXISTS / IF EXISTS.
-- The data UPDATEs and DELETEs are also idempotent.

BEGIN;

-- =============================================================================
-- 015  Delete chat thread
-- =============================================================================

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

-- =============================================================================
-- 017  Buyer counter-offer RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION public.buyer_counter_offer(
  p_offer_id bigint,
  p_counter_price numeric DEFAULT NULL,
  p_counter_start timestamptz DEFAULT NULL,
  p_counter_end timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_detail text;
  v_buyer text;
  v_price_text text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  IF v_offer.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can counter this offer';
  END IF;
  IF v_offer.status <> 'countered' THEN
    RAISE EXCEPTION 'This seller counter is no longer available';
  END IF;
  IF v_offer.kind = 'claim' THEN
    RAISE EXCEPTION 'Claims cannot be countered';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id FOR UPDATE;
  IF v_listing.status <> 'live' THEN
    RAISE EXCEPTION 'This listing is no longer available';
  END IF;

  IF v_offer.kind = 'offer' THEN
    IF p_counter_price IS NULL OR p_counter_price <= 0 THEN
      RAISE EXCEPTION 'Enter a valid counter price';
    END IF;
    IF p_counter_price = trunc(p_counter_price) THEN
      v_price_text := trim(to_char(p_counter_price, 'FM999999999990'));
    ELSE
      v_price_text := trim(to_char(p_counter_price, 'FM999999999990.00'));
    END IF;
    v_detail := format('Offer: HK$%s', v_price_text);
    UPDATE public.offers
    SET status = 'countered', price = p_counter_price, detail = v_detail
    WHERE id = p_offer_id;
  ELSE
    IF p_counter_start IS NULL OR p_counter_end IS NULL
      OR p_counter_end < p_counter_start + interval '5 seconds' THEN
      RAISE EXCEPTION 'Choose a valid lending period of at least 5 seconds';
    END IF;
    v_detail := format(
      'Borrow request: %s → %s',
      to_char(p_counter_start AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am'),
      to_char(p_counter_end AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am')
    );
    UPDATE public.offers
    SET status = 'countered', start_at = p_counter_start, end_at = p_counter_end, detail = v_detail
    WHERE id = p_offer_id;
  END IF;

  SELECT username INTO v_buyer FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_listing.seller_id, 'Offer', 'Buyer sent a counter',
    format('@%s countered for “%s”. %s', v_buyer, v_listing.title, v_detail),
    'inbox', 'gold', 'View listing'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buyer_counter_offer(bigint, numeric, timestamptz, timestamptz) TO authenticated;

-- =============================================================================
-- 018  Auto-complete accepted purchase/giveaway deals
--      (respond_to_offer body omitted — 021 is the final version)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.accept_counter_offer(p_offer_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_next_offer_status text;
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

  v_next_offer_status := CASE v_offer.kind
    WHEN 'borrow' THEN 'accepted'
    ELSE 'completed'
  END;
  v_next_listing_status := CASE v_offer.kind
    WHEN 'offer' THEN 'sold'
    WHEN 'borrow' THEN 'lent'
    ELSE 'given'
  END;

  PERFORM set_config('app.listing_rpc', 'on', true);
  UPDATE public.offers
  SET status = v_next_offer_status,
      completed_at = CASE WHEN v_next_offer_status = 'completed' THEN now() ELSE NULL END
  WHERE id = p_offer_id;
  UPDATE public.offers
  SET status = 'declined',
      detail = coalesce(detail || ' · ', '') || 'Automatically declined because another request was accepted'
  WHERE listing_id = v_listing.id
    AND id <> p_offer_id
    AND status IN ('pending', 'countered');
  UPDATE public.listings SET status = v_next_listing_status WHERE id = v_listing.id;

  SELECT username INTO v_buyer FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_listing.seller_id, 'Offer',
    CASE WHEN v_next_offer_status = 'completed' THEN 'Counter offer completed' ELSE 'Counter offer accepted' END,
    format('@%s accepted your counter for “%s”. Listing is now %s.', v_buyer, v_listing.title, v_next_listing_status),
    'check', 'green', 'View listing'
  );
END;
$$;

UPDATE public.offers
SET status = 'completed',
    completed_at = coalesce(completed_at, now())
WHERE kind IN ('offer', 'claim')
  AND status = 'accepted';

UPDATE public.listings l
SET status = CASE o.kind WHEN 'offer' THEN 'sold' ELSE 'given' END
FROM public.offers o
WHERE o.listing_id = l.id
  AND o.status = 'completed'
  AND o.kind IN ('offer', 'claim');

GRANT EXECUTE ON FUNCTION public.accept_counter_offer(bigint) TO authenticated;

-- =============================================================================
-- 019  Server timestamp on rating replies
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_rating_reply_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.seller_reply IS DISTINCT FROM OLD.seller_reply
     AND NEW.seller_reply IS NOT NULL THEN
    NEW.replied_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ratings_reply_timestamp ON public.ratings;
CREATE TRIGGER ratings_reply_timestamp
BEFORE UPDATE OF seller_reply ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.set_rating_reply_timestamp();

-- =============================================================================
-- 020  Chat notification listing/thread targets
-- =============================================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS listing_id bigint REFERENCES public.listings (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS thread_id bigint REFERENCES public.chat_threads (id) ON DELETE SET NULL;

DROP FUNCTION IF EXISTS public.notify_user(uuid, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.notify_user(uuid, text, text, text, text, text, text, bigint, bigint);

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

-- =============================================================================
-- 021  Final respond_to_offer (buyer counter + auto-complete + seller reopen)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.respond_to_offer(
  p_offer_id bigint,
  p_action text,
  p_counter_price numeric DEFAULT NULL,
  p_counter_start timestamptz DEFAULT NULL,
  p_counter_end timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_next_listing_status text;
  v_detail text;
  v_actor text;
  v_price_text text;
  v_next_offer_status text;
  v_is_seller boolean;
  v_is_buyer boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_action NOT IN ('accept', 'decline', 'counter') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id FOR UPDATE;

  v_is_seller := v_listing.seller_id = auth.uid();
  v_is_buyer := v_offer.buyer_id = auth.uid();
  PERFORM set_config('app.listing_rpc', 'on', true);

  IF p_action = 'counter' THEN
    IF NOT v_is_seller AND NOT v_is_buyer AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only the buyer or seller can counter this request';
    END IF;
    IF v_offer.status NOT IN ('pending', 'countered', 'declined') THEN
      RAISE EXCEPTION 'This request is no longer pending';
    END IF;
    IF v_offer.status = 'declined' AND NOT v_is_seller AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only the seller can reopen a declined offer';
    END IF;
    IF v_listing.status <> 'live' THEN
      RAISE EXCEPTION 'This listing is no longer available';
    END IF;
    IF v_offer.kind = 'claim' THEN
      RAISE EXCEPTION 'Claims cannot be countered';
    END IF;

    IF v_offer.kind = 'offer' THEN
      IF p_counter_price IS NULL OR p_counter_price <= 0 THEN
        RAISE EXCEPTION 'Enter a valid counter price';
      END IF;
      IF p_counter_price = trunc(p_counter_price) THEN
        v_price_text := trim(to_char(p_counter_price, 'FM999999999990'));
      ELSE
        v_price_text := trim(to_char(p_counter_price, 'FM999999999990.00'));
      END IF;
      v_detail := format('Offer: HK$%s', v_price_text);
      UPDATE public.offers
      SET status = CASE WHEN v_offer.status = 'declined' AND v_is_seller
                        THEN 'pending'
                        ELSE 'countered'
                   END,
          price = p_counter_price,
          detail = v_detail
      WHERE id = p_offer_id;
    ELSE
      IF p_counter_start IS NULL OR p_counter_end IS NULL OR p_counter_end < p_counter_start + interval '5 seconds' THEN
        RAISE EXCEPTION 'Choose a valid lending period of at least 5 seconds';
      END IF;
      v_detail := format(
        'Borrow request: %s → %s',
        to_char(p_counter_start AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am'),
        to_char(p_counter_end AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am')
      );
      UPDATE public.offers
      SET status = CASE WHEN v_offer.status = 'declined' AND v_is_seller
                        THEN 'pending'
                        ELSE 'countered'
                   END,
          start_at = p_counter_start,
          end_at = p_counter_end,
          detail = v_detail
      WHERE id = p_offer_id;
    END IF;

    IF v_is_buyer THEN
      SELECT username INTO v_actor FROM public.profiles WHERE id = v_offer.buyer_id;
      PERFORM public.notify_user(
        v_listing.seller_id, 'Offer', 'Buyer sent a counter',
        format('@%s countered for “%s”. %s', v_actor, v_listing.title, v_detail),
        'inbox', 'gold', 'View listing'
      );
    ELSE
      SELECT username INTO v_actor FROM public.profiles WHERE id = v_listing.seller_id;
      PERFORM public.notify_user(
        v_offer.buyer_id, 'Offer', 'Seller sent a counter',
        format('@%s sent a new offer for “%s”. %s', v_actor, v_listing.title, v_detail),
        'inbox', 'gold', 'View deal'
      );
    END IF;
    RETURN;
  END IF;

  IF NOT v_is_seller AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the seller can accept or decline this request';
  END IF;
  IF v_offer.status NOT IN ('pending', 'countered') THEN
    RAISE EXCEPTION 'This request is no longer pending';
  END IF;

  SELECT username INTO v_actor FROM public.profiles WHERE id = v_listing.seller_id;

  IF p_action = 'decline' THEN
    UPDATE public.offers SET status = 'declined' WHERE id = p_offer_id;
    IF v_offer.kind = 'claim' AND v_listing.status = 'reserved' THEN
      UPDATE public.listings SET status = 'live' WHERE id = v_listing.id;
    END IF;
    PERFORM public.notify_user(
      v_offer.buyer_id, 'Offer', 'Offer declined',
      format('@%s declined your %s for “%s”.', v_actor, CASE v_offer.kind WHEN 'borrow' THEN 'borrow request' WHEN 'claim' THEN 'claim' ELSE 'offer' END, v_listing.title),
      'x', 'red', 'View listing'
    );
    RETURN;
  END IF;

  v_next_listing_status := CASE v_offer.kind
    WHEN 'offer' THEN 'sold'
    WHEN 'borrow' THEN 'lent'
    ELSE 'given'
  END;
  v_next_offer_status := CASE v_offer.kind
    WHEN 'borrow' THEN 'accepted'
    ELSE 'completed'
  END;

  UPDATE public.offers
  SET status = v_next_offer_status,
      completed_at = CASE WHEN v_next_offer_status = 'completed' THEN now() ELSE NULL END
  WHERE id = p_offer_id;
  UPDATE public.offers
  SET status = 'declined',
      detail = coalesce(detail || ' · ', '') || 'Automatically declined because another request was accepted'
  WHERE listing_id = v_listing.id
    AND id <> p_offer_id
    AND status IN ('pending', 'countered');
  UPDATE public.listings SET status = v_next_listing_status WHERE id = v_listing.id;

  PERFORM public.notify_user(
    v_offer.buyer_id, 'Offer',
    CASE WHEN v_next_offer_status = 'completed' THEN 'Deal completed' ELSE 'Your offer was accepted' END,
    CASE WHEN v_next_offer_status = 'completed'
      THEN format('@%s accepted your %s for “%s”. The deal is complete.', v_actor, CASE v_offer.kind WHEN 'claim' THEN 'claim' ELSE 'offer' END, v_listing.title)
      ELSE format('@%s accepted your borrow request for “%s”. Listing is now lent.', v_actor, v_listing.title)
    END,
    'check', 'green', 'View deal'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_to_offer(bigint, text, numeric, timestamptz, timestamptz) TO authenticated;

-- =============================================================================
-- 022  Seller send offer after decline
-- =============================================================================

CREATE OR REPLACE FUNCTION public.seller_make_offer_after_decline(
  p_offer_id bigint,
  p_price numeric DEFAULT NULL,
  p_start_at timestamptz DEFAULT NULL,
  p_end_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_detail text;
  v_price_text text;
  v_actor text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_offer
  FROM public.offers
  WHERE id = p_offer_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = v_offer.listing_id
  FOR UPDATE;

  IF v_listing.seller_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the seller can send a new offer';
  END IF;
  IF v_offer.status <> 'declined' THEN
    RAISE EXCEPTION 'This request is not declined';
  END IF;
  IF v_listing.status <> 'live' THEN
    RAISE EXCEPTION 'This listing is no longer available';
  END IF;
  IF v_offer.kind = 'claim' THEN
    RAISE EXCEPTION 'Claims cannot be countered';
  END IF;

  IF v_offer.kind = 'offer' THEN
    IF p_price IS NULL OR p_price <= 0 THEN
      RAISE EXCEPTION 'Enter a valid offer amount';
    END IF;
    IF p_price = trunc(p_price) THEN
      v_price_text := trim(to_char(p_price, 'FM999999999990'));
    ELSE
      v_price_text := trim(to_char(p_price, 'FM999999999990.00'));
    END IF;
    v_detail := format('Offer: HK$%s', v_price_text);
    UPDATE public.offers
    SET status = 'pending', price = p_price, detail = v_detail
    WHERE id = p_offer_id;
  ELSE
    IF p_start_at IS NULL OR p_end_at IS NULL
      OR p_end_at < p_start_at + interval '5 seconds' THEN
      RAISE EXCEPTION 'Choose a valid lending period of at least 5 seconds';
    END IF;
    v_detail := format(
      'Borrow request: %s → %s',
      to_char(p_start_at AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am'),
      to_char(p_end_at AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am')
    );
    UPDATE public.offers
    SET status = 'pending', start_at = p_start_at, end_at = p_end_at, detail = v_detail
    WHERE id = p_offer_id;
  END IF;

  SELECT username INTO v_actor
  FROM public.profiles
  WHERE id = v_listing.seller_id;
  PERFORM public.notify_user(
    v_offer.buyer_id, 'Offer', 'Seller sent a new offer',
    format('@%s sent a new offer for “%s”. %s', v_actor, v_listing.title, v_detail),
    'inbox', 'gold', 'View deal'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.seller_make_offer_after_decline(bigint, numeric, timestamptz, timestamptz)
  TO authenticated;

-- =============================================================================
-- 023  Buyer decline offer
-- =============================================================================

CREATE OR REPLACE FUNCTION public.buyer_decline_offer(p_offer_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_buyer text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_offer
  FROM public.offers
  WHERE id = p_offer_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  IF v_offer.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can decline this offer';
  END IF;
  IF v_offer.status NOT IN ('pending', 'countered') THEN
    RAISE EXCEPTION 'This offer is no longer available';
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = v_offer.listing_id
  FOR UPDATE;

  UPDATE public.offers
  SET status = 'declined'
  WHERE id = p_offer_id;

  SELECT username INTO v_buyer
  FROM public.profiles
  WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_listing.seller_id,
    'Offer',
    'Offer declined',
    format('@%s declined the offer for “%s”.', v_buyer, v_listing.title),
    'x',
    'red',
    'View listing'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buyer_decline_offer(bigint) TO authenticated;

-- =============================================================================
-- 024  Prevent self-chat
-- =============================================================================

DELETE FROM public.chat_threads
WHERE buyer_id = seller_id;

DELETE FROM public.offers o
USING public.listings l
WHERE o.listing_id = l.id
  AND o.buyer_id = l.seller_id;

ALTER TABLE public.chat_threads
  DROP CONSTRAINT IF EXISTS chat_threads_no_self_chat;

ALTER TABLE public.chat_threads
  ADD CONSTRAINT chat_threads_no_self_chat
  CHECK (buyer_id <> seller_id);

DROP POLICY IF EXISTS threads_insert ON public.chat_threads;
CREATE POLICY threads_insert ON public.chat_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id = auth.uid()
    AND buyer_id <> seller_id
    AND EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = listing_id
        AND l.seller_id = seller_id
    )
  );

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

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id;

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

  IF v_buyer = v_listing.seller_id THEN
    RAISE EXCEPTION 'You cannot open a chat with yourself';
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
      'Hi! Thanks for your interest in "%s". Happy to meet on campus whenever it suits you. You can buy now at the listed price whenever you are ready.',
      v_listing.title
    );
  ELSIF v_listing.listing_type = 'lend' THEN
    v_welcome := format(
      'Hi! Thanks for your interest in "%s". You are welcome to borrow it. Send a borrow request when you are ready to start the deal.',
      v_listing.title
    );
  ELSE
    v_welcome := format(
      'Hi! Thanks for your interest in "%s". This is a giveaway. Send a claim request when you are ready to start the deal.',
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
    format('@%s started a conversation about "%s".', v_buyer_name, v_listing.title),
    'message',
    'navy',
    'Open chat',
    v_listing.id,
    v_thread_id
  );

  RETURN v_thread_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.open_chat_thread(bigint, uuid) TO authenticated;

-- =============================================================================
-- 025  Offer turn owner
-- =============================================================================

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS last_action_by text
  CHECK (last_action_by IN ('buyer', 'seller'));

UPDATE public.offers o
SET last_action_by = CASE
  WHEN latest.sender_id = l.seller_id THEN 'seller'
  WHEN latest.sender_id = o.buyer_id THEN 'buyer'
END
FROM public.listings l,
     (
       SELECT DISTINCT ON (m.offer_id)
         m.offer_id,
         m.sender_id
       FROM public.chat_messages m
       WHERE m.kind = 'offer'
         AND m.offer_id IS NOT NULL
       ORDER BY m.offer_id, m.created_at DESC, m.id DESC
     ) AS latest
WHERE o.listing_id = l.id
  AND latest.offer_id = o.id
  AND o.status IN ('pending', 'countered')
  AND o.last_action_by IS NULL;

CREATE OR REPLACE FUNCTION public.set_offer_last_action_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
BEGIN
  IF TG_OP = 'UPDATE'
  AND auth.uid() = (
    SELECT seller_id
    FROM public.listings
    WHERE id = OLD.listing_id
  )
  AND OLD.last_action_by = 'seller'
  AND OLD.status IN ('pending', 'countered')
  AND NOT (
    NEW.status = 'declined'
    AND NEW.detail LIKE '%Automatically declined because another request was accepted'
  ) THEN
    RAISE EXCEPTION 'You cannot act on your own offer until the buyer responds';
  END IF;

  SELECT seller_id INTO v_seller_id
  FROM public.listings
  WHERE id = NEW.listing_id;

  IF auth.uid() = v_seller_id THEN
    NEW.last_action_by := 'seller';
  ELSIF auth.uid() = NEW.buyer_id THEN
    NEW.last_action_by := 'buyer';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS offers_set_last_action_by ON public.offers;
CREATE TRIGGER offers_set_last_action_by
BEFORE INSERT OR UPDATE OF status, price, start_at, end_at, detail
ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.set_offer_last_action_by();

COMMIT;
