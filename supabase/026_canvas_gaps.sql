-- Follow-on after 014 and 015_to_025_apply.sql.
-- Canvas gaps: hide chat instead of deleting it, notify buyer of seller replies,
-- notify buyers when a listing with active offers is edited, borrow due-date
-- reminders before auto-return, and optional admin notify on flagged reviews.
-- Safe to re-run.

BEGIN;

-- ---------------------------------------------------------------------------
-- Soft-hide chat threads (history stays searchable)
-- ---------------------------------------------------------------------------
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

  UPDATE public.chat_threads
  SET
    buyer_hidden_at = CASE WHEN buyer_id = auth.uid() THEN NULL ELSE buyer_hidden_at END,
    seller_hidden_at = CASE WHEN seller_id = auth.uid() THEN NULL ELSE seller_hidden_at END
  WHERE id = v_thread_id;

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

-- ---------------------------------------------------------------------------
-- Seller reply → buyer notification; flagged review → admin notification
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_rating_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller text;
  v_buyer text;
  v_title text;
BEGIN
  SELECT p.username INTO v_seller FROM public.profiles p WHERE p.id = NEW.seller_id;
  SELECT p.username INTO v_buyer FROM public.profiles p WHERE p.id = NEW.buyer_id;
  SELECT l.title INTO v_title
  FROM public.offers o
  JOIN public.listings l ON l.id = o.listing_id
  WHERE o.id = NEW.offer_id;

  IF NEW.seller_reply IS DISTINCT FROM OLD.seller_reply
     AND NEW.seller_reply IS NOT NULL THEN
    PERFORM public.notify_user(
      NEW.buyer_id,
      'Ratings',
      'Seller replied',
      format('@%s replied to your review of “%s”.', coalesce(v_seller, 'seller'), coalesce(v_title, 'your purchase')),
      'star',
      'green',
      'View rating'
    );
  END IF;

  IF NEW.flagged IS TRUE AND OLD.flagged IS DISTINCT FROM TRUE THEN
    PERFORM public.notify_admins(
      'Ratings',
      'Review flagged for moderation',
      format('@%s flagged a review from @%s on “%s”.', coalesce(v_seller, 'seller'), coalesce(v_buyer, 'buyer'), coalesce(v_title, 'a listing')),
      'x',
      'red',
      'View reviews'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ratings_notify_on_update ON public.ratings;
CREATE TRIGGER ratings_notify_on_update
AFTER UPDATE OF seller_reply, flagged ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_rating_update();

-- ---------------------------------------------------------------------------
-- Notify buyers with open offers when the listing is edited
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_active_offer_buyers_of_listing_edit(p_listing_id bigint)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_seller text;
  v_count integer := 0;
  rec record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  IF v_listing.seller_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the seller can notify buyers about this listing';
  END IF;

  SELECT username INTO v_seller FROM public.profiles WHERE id = v_listing.seller_id;

  FOR rec IN
    SELECT DISTINCT buyer_id
    FROM public.offers
    WHERE listing_id = p_listing_id
      AND status IN ('pending', 'countered')
  LOOP
    PERFORM public.notify_user(
      rec.buyer_id,
      'Listing',
      'Listing updated',
      format('@%s updated “%s”. Your open offer is still active.', coalesce(v_seller, 'seller'), v_listing.title),
      'bag',
      'gold',
      'View listing',
      v_listing.id
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_active_offer_buyers_of_listing_edit(bigint) TO authenticated;

-- ---------------------------------------------------------------------------
-- Borrow due-date reminder, then existing auto-return
-- ---------------------------------------------------------------------------
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS due_reminder_sent_at timestamptz;

CREATE OR REPLACE FUNCTION public.expire_overdue_borrows()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  n integer := 0;
  v_due text;
BEGIN
  FOR rec IN
    SELECT o.*, l.title, l.seller_id
    FROM public.offers o
    JOIN public.listings l ON l.id = o.listing_id
    WHERE o.kind = 'borrow'
      AND o.status = 'accepted'
      AND o.end_at IS NOT NULL
      AND o.end_at > now()
      AND o.due_reminder_sent_at IS NULL
      AND o.end_at <= now() + interval '1 hour'
  LOOP
    UPDATE public.offers
    SET due_reminder_sent_at = now()
    WHERE id = rec.id;
    v_due := to_char(rec.end_at AT TIME ZONE 'Asia/Hong_Kong', 'FMDD Mon YYYY, FMHH12:MI am');
    PERFORM public.notify_user(
      rec.buyer_id, 'Borrow reminder', 'Borrow due soon',
      format('“%s” is due %s. Return it before then, or it will be returned automatically.', rec.title, v_due),
      'clock', 'gold', 'View borrowed item'
    );
  END LOOP;

  FOR rec IN
    SELECT o.*, l.title, l.seller_id
    FROM public.offers o
    JOIN public.listings l ON l.id = o.listing_id
    WHERE o.kind = 'borrow'
      AND o.status = 'accepted'
      AND o.end_at IS NOT NULL
      AND o.end_at < now()
  LOOP
    PERFORM set_config('app.listing_rpc', 'on', true);
    UPDATE public.offers
    SET status = 'returned',
        completed_at = now(),
        detail = coalesce(rec.detail || ' · ', '') || 'Returned automatically when the lending period expired'
    WHERE id = rec.id;

    UPDATE public.listings
    SET status = 'live'
    WHERE id = rec.listing_id AND status = 'lent';

    PERFORM public.notify_user(
      rec.buyer_id, 'Borrow reminder', 'Borrowing period ended',
      format('“%s” was marked returned because the lending period expired.', rec.title),
      'clock', 'gold', 'View borrowed item'
    );
    PERFORM public.notify_user(
      rec.seller_id, 'Borrow reminder', 'Borrowed item auto-returned',
      format('The lending period for “%s” ended. The listing is available again.', rec.title),
      'clock', 'gold', 'View listing'
    );
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_overdue_borrows() TO authenticated;

CREATE OR REPLACE FUNCTION public.return_borrow(p_offer_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND OR v_offer.kind <> 'borrow' THEN
    RAISE EXCEPTION 'Borrow request not found';
  END IF;
  IF v_offer.buyer_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the borrower can return this item';
  END IF;
  IF v_offer.status = 'returned' THEN
    UPDATE public.listings SET status = 'live' WHERE id = v_offer.listing_id AND status = 'lent';
    RETURN;
  END IF;
  IF v_offer.status <> 'accepted' THEN
    RAISE EXCEPTION 'This item is not currently borrowed';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id;
  PERFORM set_config('app.listing_rpc', 'on', true);

  UPDATE public.offers
  SET status = 'returned',
      completed_at = now(),
      detail = coalesce(detail || ' · ', '') || 'Returned early'
  WHERE id = p_offer_id;

  UPDATE public.listings SET status = 'live' WHERE id = v_listing.id AND status = 'lent';

  PERFORM public.notify_user(
    v_listing.seller_id, 'Borrow reminder', 'Item returned early',
    format('The buyer returned “%s” before the due date.', v_listing.title),
    'check', 'green', 'View listing'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.return_borrow(bigint) TO authenticated;

COMMIT;
