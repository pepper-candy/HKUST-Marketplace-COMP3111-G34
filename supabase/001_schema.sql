-- HKUST Marketplace Task 1–3 schema
-- Apply in the Supabase Dashboard: SQL Editor → New query → paste this file → Run.
-- Do not store service_role / sb_secret keys in the app or in git.

BEGIN;

-- ---------------------------------------------------------------------------
-- Privileges (auto-expose new tables is off — grant explicitly)
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
  residence text,
  bio text,
  meetup_locations text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated', 'deleted')),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));

CREATE TABLE public.listings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_id uuid NOT NULL REFERENCES public.profiles (id),
  title text NOT NULL,
  category text NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('sell', 'lend', 'giveaway')),
  condition text NOT NULL,
  description text NOT NULL,
  price numeric(12, 2),
  lending_duration_value integer,
  lending_duration_unit text CHECK (lending_duration_unit IN ('Hours', 'Days', 'Weeks')),
  meetup_location text NOT NULL,
  photos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'live', 'rejected', 'reserved', 'sold', 'lent', 'given', 'removed')),
  rejection_reason text,
  removed_reason text,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listings_sell_price CHECK (listing_type <> 'sell' OR price IS NOT NULL),
  CONSTRAINT listings_photos_limit CHECK (cardinality(photos) <= 6)
);

CREATE TABLE public.offers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id bigint NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles (id),
  kind text NOT NULL CHECK (kind IN ('offer', 'borrow', 'claim')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'completed', 'cancelled', 'returned')),
  price numeric(12, 2),
  start_at timestamptz,
  end_at timestamptz,
  detail text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offers_borrow_minimum CHECK (
    kind <> 'borrow'
    OR start_at IS NULL
    OR end_at IS NULL
    OR end_at >= start_at + interval '5 seconds'
  )
);

CREATE TABLE public.chat_threads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id bigint NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles (id),
  seller_id uuid NOT NULL REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);

CREATE TABLE public.chat_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  thread_id bigint NOT NULL REFERENCES public.chat_threads (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles (id),
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'message' CHECK (kind IN ('message', 'offer')),
  offer_id bigint REFERENCES public.offers (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages
  ADD COLUMN body_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(body, ''))) STORED;

CREATE INDEX chat_messages_tsv_idx ON public.chat_messages USING gin (body_tsv);
CREATE INDEX chat_messages_thread_idx ON public.chat_messages (thread_id, created_at);

CREATE TABLE public.ratings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  offer_id bigint NOT NULL UNIQUE REFERENCES public.offers (id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles (id),
  seller_id uuid NOT NULL REFERENCES public.profiles (id),
  stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review_text text,
  seller_reply text,
  replied_at timestamptz,
  flagged boolean NOT NULL DEFAULT false,
  flag_reason text,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  icon text NOT NULL DEFAULT 'bell',
  tone text NOT NULL DEFAULT 'navy' CHECK (tone IN ('navy', 'gold', 'green', 'red')),
  action text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);

CREATE TABLE public.listing_reports (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id bigint NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles (id),
  reason text NOT NULL DEFAULT 'Inappropriate or unsafe listing',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, reporter_id)
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
      AND deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
    AND status = 'active'
    AND deleted_at IS NULL;
$$;

-- SECURITY DEFINER so listings/offers policies do not recurse into each other.
CREATE OR REPLACE FUNCTION public.owns_listing(p_listing_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings
    WHERE id = p_listing_id
      AND seller_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_offer_on_listing(p_listing_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offers
    WHERE listing_id = p_listing_id
      AND buyer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id uuid,
  p_category text,
  p_title text,
  p_message text,
  p_icon text DEFAULT 'bell',
  p_tone text DEFAULT 'navy',
  p_action text DEFAULT NULL
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
  INSERT INTO public.notifications (user_id, category, title, message, icon, tone, action)
  VALUES (p_user_id, p_category, p_title, p_message, p_icon, p_tone, p_action);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admins(
  p_category text,
  p_title text,
  p_message text,
  p_icon text DEFAULT 'bell',
  p_tone text DEFAULT 'gold',
  p_action text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_row public.profiles;
BEGIN
  FOR admin_row IN
    SELECT * FROM public.profiles
    WHERE role = 'admin' AND status = 'active' AND deleted_at IS NULL
  LOOP
    PERFORM public.notify_user(admin_row.id, p_category, p_title, p_message, p_icon, p_tone, p_action);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Auth: create profile on signup. Admin email is reserved.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  v_username text;
  v_full_name text;
  v_role text;
  v_meetups text[];
BEGIN
  v_username := lower(trim(coalesce(v_meta->>'username', split_part(NEW.email, '@', 1))));
  v_full_name := trim(coalesce(v_meta->>'full_name', v_username));
  v_role := lower(trim(coalesce(v_meta->>'role', '')));

  IF jsonb_typeof(v_meta->'meetups') = 'array' THEN
    v_meetups := ARRAY(SELECT jsonb_array_elements_text(v_meta->'meetups'));
  ELSE
    v_meetups := '{}';
  END IF;

  IF lower(NEW.email) = 'admin@ust.hk' THEN
    IF v_role IN ('buyer', 'seller') THEN
      RAISE EXCEPTION 'This username is reserved for the administrator';
    END IF;
    v_username := 'admin@ust.hk';
    v_role := 'admin';
    IF v_full_name = '' OR lower(v_full_name) IN ('admin', 'admin@ust.hk') THEN
      v_full_name := 'Marketplace Admin';
    END IF;
  ELSE
    IF v_username = 'admin@ust.hk' THEN
      RAISE EXCEPTION 'This username is reserved for the administrator';
    END IF;
    IF v_role NOT IN ('buyer', 'seller') THEN
      v_role := 'buyer';
    END IF;
  END IF;

  IF v_full_name = '' THEN
    v_full_name := v_username;
  END IF;

  INSERT INTO public.profiles (
    id, username, full_name, role, residence, bio, meetup_locations
  ) VALUES (
    NEW.id,
    v_username,
    v_full_name,
    v_role,
    NULLIF(v_meta->>'residence', ''),
    NULLIF(v_meta->>'bio', ''),
    v_meetups
  );

  IF v_role IN ('buyer', 'seller') THEN
    PERFORM public.notify_admins(
      'User',
      'New account registered',
      format('@%s registered as a %s.', v_username, v_role),
      'users',
      'navy',
      'View users'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.id := OLD.id;
  NEW.username := OLD.username;
  IF NOT public.is_admin() THEN
    NEW.role := OLD.role;
    NEW.status := OLD.status;
    NEW.deleted_at := OLD.deleted_at;
  ELSIF OLD.role = 'admin' THEN
    NEW.role := 'admin';
  ELSIF NEW.role = 'admin' AND OLD.role <> 'admin' THEN
    RAISE EXCEPTION 'Cannot promote a user to admin from the app';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

CREATE OR REPLACE FUNCTION public.protect_listing_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- RPCs set app.listing_rpc so view counts, claims, and moderation can change status.
  IF current_setting('app.listing_rpc', true) = 'on' THEN
    RETURN NEW;
  END IF;
  NEW.seller_id := OLD.seller_id;
  NEW.view_count := OLD.view_count;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  -- Sellers may resubmit rejected listings; they cannot self-approve or jump to sold.
  IF OLD.status = 'rejected' AND NEW.status = 'pending' THEN
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.rejection_reason := OLD.rejection_reason;
  NEW.removed_reason := OLD.removed_reason;
  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_protect BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.protect_listing_columns();

CREATE OR REPLACE FUNCTION public.on_listing_inserted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
BEGIN
  SELECT username INTO v_username FROM public.profiles WHERE id = NEW.seller_id;
  IF NEW.status = 'pending' THEN
    PERFORM public.notify_admins(
      'Listing review',
      'New listing awaiting review',
      format('@%s submitted “%s” for approval.', coalesce(v_username, 'seller'), NEW.title),
      'check',
      'gold',
      'Review listing'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_inserted AFTER INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.on_listing_inserted();

-- ---------------------------------------------------------------------------
-- Login helper (anon + authenticated)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_login_email(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT au.email INTO v_email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE lower(p.username) = lower(trim(p_username))
    AND p.deleted_at IS NULL
  LIMIT 1;
  RETURN v_email;
END;
$$;

-- ---------------------------------------------------------------------------
-- Borrow auto-return when the lending period expires
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_overdue_borrows()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  n integer := 0;
BEGIN
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

CREATE OR REPLACE FUNCTION public.increment_listing_views(p_listing_id bigint)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM set_config('app.listing_rpc', 'on', true);

  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = p_listing_id
    AND status IN ('pending', 'live', 'rejected', 'reserved', 'sold', 'lent', 'given', 'removed')
  RETURNING view_count INTO v_count;

  IF v_count IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_offer(
  p_listing_id bigint,
  p_kind text,
  p_price numeric DEFAULT NULL,
  p_start_at timestamptz DEFAULT NULL,
  p_end_at timestamptz DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_offer_id bigint;
  v_detail text;
  v_buyer text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_kind NOT IN ('offer', 'borrow') THEN
    RAISE EXCEPTION 'Use claim_giveaway for giveaway items';
  END IF;
  IF public.current_profile_role() <> 'buyer' THEN
    RAISE EXCEPTION 'Only buyers can submit offers';
  END IF;

  PERFORM public.expire_overdue_borrows();
  PERFORM set_config('app.listing_rpc', 'on', true);

  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  IF v_listing.status <> 'live' THEN
    RAISE EXCEPTION 'This listing is no longer available';
  END IF;
  IF v_listing.seller_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot act on your own listing';
  END IF;
  IF p_kind = 'offer' AND v_listing.listing_type <> 'sell' THEN
    RAISE EXCEPTION 'This listing is not for sale';
  END IF;
  IF p_kind = 'borrow' AND v_listing.listing_type <> 'lend' THEN
    RAISE EXCEPTION 'This listing is not for lending';
  END IF;
  IF p_kind = 'offer' AND (p_price IS NULL OR p_price <= 0) THEN
    RAISE EXCEPTION 'Enter a valid offer amount';
  END IF;
  IF p_kind = 'borrow' THEN
    IF p_start_at IS NULL OR p_end_at IS NULL THEN
      RAISE EXCEPTION 'Choose both a start and end date';
    END IF;
    IF p_end_at < p_start_at + interval '5 seconds' THEN
      RAISE EXCEPTION 'End time must be at least 5 seconds after the start time';
    END IF;
  END IF;

  IF p_kind = 'offer' THEN
    v_detail := format('Proposed price: HK$%s', to_char(p_price, 'FM999999990.00'));
  ELSE
    v_detail := format('%s → %s', p_start_at, p_end_at);
  END IF;

  INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail)
  VALUES (p_listing_id, auth.uid(), p_kind, 'pending', p_price, p_start_at, p_end_at, v_detail)
  RETURNING id INTO v_offer_id;

  SELECT username INTO v_buyer FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_listing.seller_id,
    'Offer',
    CASE WHEN p_kind = 'offer' THEN 'New offer received' ELSE 'New borrow request' END,
    format('@%s submitted a %s on “%s”.', v_buyer, p_kind, v_listing.title),
    'bag',
    'gold',
    'Review request'
  );

  RETURN v_offer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_giveaway(p_listing_id bigint)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_offer_id bigint;
  v_buyer text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF public.current_profile_role() <> 'buyer' THEN
    RAISE EXCEPTION 'Only buyers can claim giveaways';
  END IF;

  PERFORM public.expire_overdue_borrows();
  PERFORM set_config('app.listing_rpc', 'on', true);

  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  IF v_listing.listing_type <> 'giveaway' THEN
    RAISE EXCEPTION 'This listing is not a giveaway';
  END IF;
  IF v_listing.status <> 'live' THEN
    RAISE EXCEPTION 'This giveaway is no longer available';
  END IF;
  IF v_listing.seller_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot claim your own listing';
  END IF;

  UPDATE public.listings
  SET status = 'reserved'
  WHERE id = p_listing_id AND status = 'live';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This giveaway is no longer available';
  END IF;

  INSERT INTO public.offers (listing_id, buyer_id, kind, status, detail)
  VALUES (p_listing_id, auth.uid(), 'claim', 'pending', 'Claim request')
  RETURNING id INTO v_offer_id;

  SELECT username INTO v_buyer FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_user(
    v_listing.seller_id,
    'Offer',
    'New claim received',
    format('@%s claimed “%s”. Only this first claim was recorded.', v_buyer, v_listing.title),
    'bag',
    'gold',
    'Review request'
  );

  RETURN v_offer_id;
END;
$$;

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
  v_seller text;
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

  PERFORM set_config('app.listing_rpc', 'on', true);

  IF v_listing.seller_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the seller can respond to this request';
  END IF;
  IF v_offer.status NOT IN ('pending', 'countered') THEN
    RAISE EXCEPTION 'This request is no longer pending';
  END IF;

  SELECT username INTO v_seller FROM public.profiles WHERE id = v_listing.seller_id;

  IF p_action = 'decline' THEN
    UPDATE public.offers SET status = 'declined' WHERE id = p_offer_id;
    IF v_offer.kind = 'claim' AND v_listing.status = 'reserved' THEN
      UPDATE public.listings SET status = 'live' WHERE id = v_listing.id;
    END IF;
    PERFORM public.notify_user(
      v_offer.buyer_id, 'Offer', 'Offer declined',
      format('@%s declined your %s for “%s”.', v_seller, v_offer.kind, v_listing.title),
      'x', 'red', 'View listing'
    );
    RETURN;
  END IF;

  IF p_action = 'counter' THEN
    IF v_offer.kind = 'claim' THEN
      RAISE EXCEPTION 'Claims cannot be countered';
    END IF;
    IF v_offer.kind = 'offer' THEN
      IF p_counter_price IS NULL OR p_counter_price <= 0 THEN
        RAISE EXCEPTION 'Enter a valid counter price';
      END IF;
      v_detail := format('Seller counter: HK$%s', to_char(p_counter_price, 'FM999999990.00'));
      UPDATE public.offers
      SET status = 'countered', price = p_counter_price, detail = v_detail
      WHERE id = p_offer_id;
    ELSE
      IF p_counter_start IS NULL OR p_counter_end IS NULL OR p_counter_end < p_counter_start + interval '5 seconds' THEN
        RAISE EXCEPTION 'Choose a valid lending period of at least 5 seconds';
      END IF;
      v_detail := format('Seller proposed new lending dates: %s → %s', p_counter_start, p_counter_end);
      UPDATE public.offers
      SET status = 'countered', start_at = p_counter_start, end_at = p_counter_end, detail = v_detail
      WHERE id = p_offer_id;
    END IF;
    PERFORM public.notify_user(
      v_offer.buyer_id, 'Offer', 'Seller sent a counter',
      format('@%s countered your %s for “%s”. %s', v_seller, v_offer.kind, v_listing.title, v_detail),
      'inbox', 'gold', 'View deal'
    );
    RETURN;
  END IF;

  v_next_listing_status := CASE v_offer.kind
    WHEN 'offer' THEN 'reserved'
    WHEN 'borrow' THEN 'lent'
    ELSE 'given'
  END;

  UPDATE public.offers SET status = 'accepted' WHERE id = p_offer_id;
  UPDATE public.offers
  SET status = 'declined',
      detail = coalesce(detail || ' · ', '') || 'Automatically declined because another request was accepted'
  WHERE listing_id = v_listing.id
    AND id <> p_offer_id
    AND status IN ('pending', 'countered');

  UPDATE public.listings SET status = v_next_listing_status WHERE id = v_listing.id;

  PERFORM public.notify_user(
    v_offer.buyer_id, 'Offer', 'Your offer was accepted',
    format('@%s accepted your %s for “%s”. Listing is now %s.', v_seller, v_offer.kind, v_listing.title, v_next_listing_status),
    'check', 'green', 'View deal'
  );
END;
$$;

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

CREATE OR REPLACE FUNCTION public.complete_deal(
  p_offer_id bigint,
  p_stars integer DEFAULT NULL,
  p_review text DEFAULT NULL
)
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
  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;
  IF v_offer.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can complete this deal';
  END IF;
  IF v_offer.status NOT IN ('accepted', 'returned', 'completed') THEN
    RAISE EXCEPTION 'This deal cannot be completed yet';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = v_offer.listing_id;
  PERFORM set_config('app.listing_rpc', 'on', true);

  IF v_offer.status <> 'completed' THEN
    UPDATE public.offers
    SET status = 'completed',
        completed_at = coalesce(completed_at, now()),
        detail = coalesce(detail || ' · ', '') || 'Buyer marked the deal complete'
    WHERE id = p_offer_id;

    IF v_offer.kind = 'offer' THEN
      UPDATE public.listings SET status = 'sold' WHERE id = v_listing.id;
    ELSIF v_offer.kind = 'claim' THEN
      UPDATE public.listings SET status = 'given' WHERE id = v_listing.id;
    END IF;

    SELECT username INTO v_buyer FROM public.profiles WHERE id = v_offer.buyer_id;
    PERFORM public.notify_user(
      v_listing.seller_id, 'Deal', 'Buyer marked a deal complete',
      format('@%s marked “%s” as complete.', v_buyer, v_listing.title),
      'check', 'green', 'View listing'
    );
  ELSE
    SELECT username INTO v_buyer FROM public.profiles WHERE id = v_offer.buyer_id;
  END IF;

  IF p_stars IS NOT NULL THEN
    IF p_stars < 1 OR p_stars > 5 THEN
      RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;
    INSERT INTO public.ratings (offer_id, buyer_id, seller_id, stars, review_text)
    VALUES (p_offer_id, v_offer.buyer_id, v_listing.seller_id, p_stars, NULLIF(p_review, ''))
    ON CONFLICT (offer_id) DO NOTHING;
    PERFORM public.notify_user(
      v_listing.seller_id, 'Rating', 'New rating received',
      format('@%s rated you %s/5 for “%s”.', v_buyer, p_stars, v_listing.title),
      'star', 'gold', 'View reviews'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.moderate_listing(
  p_listing_id bigint,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_offer record;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF p_action NOT IN ('approve', 'reject', 'remove') THEN
    RAISE EXCEPTION 'Invalid moderation action';
  END IF;

  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  PERFORM set_config('app.listing_rpc', 'on', true);

  IF p_action = 'approve' THEN
    UPDATE public.listings
    SET status = 'live', rejection_reason = NULL
    WHERE id = p_listing_id;
    PERFORM public.notify_user(
      v_listing.seller_id, 'Listing review', 'Listing approved',
      format('“%s” is now live on the marketplace.', v_listing.title),
      'check', 'green', 'View listing'
    );
    RETURN;
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Provide a written reason of at least 10 characters';
  END IF;

  IF p_action = 'reject' THEN
    UPDATE public.listings
    SET status = 'rejected', rejection_reason = trim(p_reason)
    WHERE id = p_listing_id;
    PERFORM public.notify_user(
      v_listing.seller_id, 'Listing review', 'Listing rejected',
      format('“%s” was rejected. Reason: %s', v_listing.title, trim(p_reason)),
      'x', 'red', 'View listing'
    );
    RETURN;
  END IF;

  UPDATE public.listings
  SET status = 'removed', removed_reason = trim(p_reason)
  WHERE id = p_listing_id;

  UPDATE public.offers
  SET status = 'cancelled',
      detail = coalesce(detail || ' · ', '') || 'Listing removed by admin'
  WHERE listing_id = p_listing_id
    AND status IN ('pending', 'countered', 'accepted');

  PERFORM public.notify_user(
    v_listing.seller_id, 'Listing', 'Listing taken down',
    format('An admin removed “%s”. Reason: %s', v_listing.title, trim(p_reason)),
    'grid', 'red', 'View listing'
  );

  FOR v_offer IN
    SELECT DISTINCT buyer_id
    FROM public.offers
    WHERE listing_id = p_listing_id
  LOOP
    PERFORM public.notify_user(
      v_offer.buyer_id, 'Listing', 'A listing you offered on was removed',
      format('An admin removed “%s”. Active offers on that listing were closed.', v_listing.title),
      'grid', 'red', 'View deals'
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.seller_remove_listing(p_listing_id bigint, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_offer record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  IF v_listing.seller_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You can only remove your own listings';
  END IF;

  PERFORM set_config('app.listing_rpc', 'on', true);

  UPDATE public.listings
  SET status = 'removed',
      removed_reason = coalesce(NULLIF(trim(p_reason), ''), 'Removed by seller')
  WHERE id = p_listing_id;

  UPDATE public.offers
  SET status = 'cancelled',
      detail = coalesce(detail || ' · ', '') || 'Listing removed by seller'
  WHERE listing_id = p_listing_id
    AND status IN ('pending', 'countered', 'accepted');

  FOR v_offer IN
    SELECT DISTINCT buyer_id
    FROM public.offers
    WHERE listing_id = p_listing_id
      AND status IN ('cancelled', 'pending', 'countered', 'accepted')
  LOOP
    PERFORM public.notify_user(
      v_offer.buyer_id, 'Listing', 'A listing you offered on was removed',
      format('The seller removed “%s”. Active offers on that listing were closed.', v_listing.title),
      'grid', 'red', 'View deals'
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  v_username text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT username INTO v_username FROM public.profiles WHERE id = p_user_id;
  IF v_username IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE public.profiles
  SET status = 'deleted', deleted_at = now()
  WHERE id = p_user_id
    AND role <> 'admin';

  FOR rec IN SELECT id FROM public.listings WHERE seller_id = p_user_id AND status IN ('pending', 'live', 'reserved', 'rejected')
  LOOP
    PERFORM public.seller_remove_listing(rec.id, 'Seller account deleted by admin');
  END LOOP;

  PERFORM public.notify_admins(
    'User',
    'Account permanently deleted',
    format('@%s was soft-deleted. Listings were taken down; deals and chats were retained for audit.', v_username),
    'users',
    'red',
    'View users'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_status(p_user_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF p_status NOT IN ('active', 'deactivated') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  SELECT username INTO v_username FROM public.profiles WHERE id = p_user_id AND role <> 'admin';
  IF v_username IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  UPDATE public.profiles SET status = p_status, deleted_at = NULL WHERE id = p_user_id;
  PERFORM public.notify_admins(
    'User',
    'User account updated',
    format('@%s is now %s.', v_username, p_status),
    'users',
    'navy',
    'View users'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.report_listing(p_listing_id bigint, p_reason text DEFAULT 'Inappropriate or unsafe listing')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_reporter text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO public.listing_reports (listing_id, reporter_id, reason)
  VALUES (p_listing_id, auth.uid(), coalesce(NULLIF(trim(p_reason), ''), 'Inappropriate or unsafe listing'))
  ON CONFLICT (listing_id, reporter_id) DO UPDATE SET reason = excluded.reason;

  SELECT title INTO v_title FROM public.listings WHERE id = p_listing_id;
  SELECT username INTO v_reporter FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_admins(
    'Report',
    'Reported listing requires moderation',
    format('@%s reported “%s”.', v_reporter, v_title),
    'x',
    'red',
    'Review listing'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.hide_rating(p_rating_id bigint, p_hidden boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE public.ratings SET hidden = p_hidden WHERE id = p_rating_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_ids bigint[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.notifications
  SET read_at = coalesce(read_at, now())
  WHERE user_id = auth.uid()
    AND (p_ids IS NULL OR id = ANY (p_ids));
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
  WHERE listing_id = p_listing_id AND buyer_id = v_buyer;

  IF v_thread_id IS NULL THEN
    INSERT INTO public.chat_threads (listing_id, buyer_id, seller_id)
    VALUES (p_listing_id, v_buyer, v_listing.seller_id)
    RETURNING id INTO v_thread_id;
  END IF;

  RETURN v_thread_id;
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
  v_title text;
BEGIN
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

CREATE TRIGGER chat_messages_notify AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.on_chat_message();

CREATE OR REPLACE FUNCTION public.search_my_chat_messages(p_query text)
RETURNS TABLE (
  id bigint,
  thread_id bigint,
  listing_id bigint,
  body text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.thread_id, t.listing_id, m.body, m.created_at
  FROM public.chat_messages m
  JOIN public.chat_threads t ON t.id = m.thread_id
  WHERE (t.buyer_id = auth.uid() OR t.seller_id = auth.uid() OR public.is_admin())
    AND (
      m.body ILIKE '%' || p_query || '%'
      OR m.body_tsv @@ plainto_tsquery('english', p_query)
    )
  ORDER BY m.created_at DESC
  LIMIT 100;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR (deleted_at IS NULL AND role IN ('buyer', 'seller'))
  );

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY listings_select ON public.listings
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR seller_id = auth.uid()
    OR status = 'live'
    OR public.has_offer_on_listing(id)
  );

CREATE POLICY listings_insert ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      seller_id = auth.uid()
      AND status = 'pending'
      AND public.current_profile_role() = 'seller'
    )
    OR public.is_admin()
  );

CREATE POLICY listings_update ON public.listings
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid() OR public.is_admin())
  WITH CHECK (seller_id = auth.uid() OR public.is_admin());

CREATE POLICY listings_delete ON public.listings
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY offers_select ON public.offers
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR buyer_id = auth.uid()
    OR public.owns_listing(listing_id)
  );

CREATE POLICY threads_select ON public.chat_threads
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());

CREATE POLICY threads_insert ON public.chat_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.seller_id = seller_id
    )
  );

CREATE POLICY messages_select ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id
        AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY messages_insert ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id
        AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

CREATE POLICY ratings_select ON public.ratings
  FOR SELECT TO authenticated
  USING (hidden = false OR public.is_admin() OR buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY ratings_insert ON public.ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = offer_id
        AND o.buyer_id = auth.uid()
        AND o.status IN ('completed', 'returned', 'accepted')
    )
  );

CREATE POLICY ratings_update ON public.ratings
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid() OR public.is_admin())
  WITH CHECK (seller_id = auth.uid() OR public.is_admin());

CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY reports_select ON public.listing_reports
  FOR SELECT TO authenticated
  USING (public.is_admin() OR reporter_id = auth.uid());

CREATE POLICY reports_insert ON public.listing_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Table / sequence / function grants
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.offers TO authenticated;
GRANT SELECT, INSERT ON public.chat_threads TO authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ratings TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT ON public.listing_reports TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION public.resolve_login_email(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_listing(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_offer_on_listing(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_overdue_borrows() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_listing_views(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_offer(bigint, text, numeric, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_giveaway(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_offer(bigint, text, numeric, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_borrow(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_deal(bigint, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_listing(bigint, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seller_remove_listing(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_listing(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hide_rating(bigint, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_my_chat_messages(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_chat_thread(bigint, uuid) TO authenticated;

COMMIT;
