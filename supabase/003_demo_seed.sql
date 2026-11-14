-- Demo marketplace seed (COMP3111 F2026 G34). Additive — do not re-run 001.
-- Dashboard SQL Editor → paste this file → Run.
-- Logins: demo/accounts.csv (Buyer / Seller portals). Admin stays admin@ust.hk.
-- Safe to re-run: wipes only the 13 demo UUIDs below, then inserts again.

BEGIN;

CREATE TEMP TABLE demo_ids (id uuid PRIMARY KEY);
INSERT INTO demo_ids (id) VALUES
  ('a1000000-0000-4000-8000-000000000001'), -- kai.lam
  ('a1000000-0000-4000-8000-000000000002'), -- sofiapeng
  ('a1000000-0000-4000-8000-000000000003'), -- noman.chow
  ('a1000000-0000-4000-8000-000000000004'), -- aisha.rahman
  ('a1000000-0000-4000-8000-000000000005'), -- tomo.sato
  ('a2000000-0000-4000-8000-000000000001'), -- wong.mei
  ('a2000000-0000-4000-8000-000000000002'), -- jason.ng
  ('a2000000-0000-4000-8000-000000000003'), -- priya.sharma
  ('a2000000-0000-4000-8000-000000000004'), -- lucas.ho
  ('a2000000-0000-4000-8000-000000000005'), -- emily.wu
  ('a2000000-0000-4000-8000-000000000006'), -- david.kwok
  ('a2000000-0000-4000-8000-000000000007'), -- hana.kim
  ('a2000000-0000-4000-8000-000000000008'); -- brian.lau

DELETE FROM public.notifications
WHERE user_id IN (SELECT id FROM demo_ids)
   OR message ~ '@(kai\.lam|sofiapeng|noman\.chow|aisha\.rahman|tomo\.sato|wong\.mei|jason\.ng|priya\.sharma|lucas\.ho|emily\.wu|david\.kwok|hana\.kim|brian\.lau)';

DELETE FROM public.listing_reports
WHERE reporter_id IN (SELECT id FROM demo_ids)
   OR listing_id IN (SELECT id FROM public.listings WHERE seller_id IN (SELECT id FROM demo_ids));

DELETE FROM public.ratings
WHERE buyer_id IN (SELECT id FROM demo_ids)
   OR seller_id IN (SELECT id FROM demo_ids);

DELETE FROM public.chat_messages
WHERE sender_id IN (SELECT id FROM demo_ids)
   OR thread_id IN (
     SELECT id FROM public.chat_threads
     WHERE buyer_id IN (SELECT id FROM demo_ids) OR seller_id IN (SELECT id FROM demo_ids)
   );

DELETE FROM public.chat_threads
WHERE buyer_id IN (SELECT id FROM demo_ids) OR seller_id IN (SELECT id FROM demo_ids);

DELETE FROM public.offers
WHERE buyer_id IN (SELECT id FROM demo_ids)
   OR listing_id IN (SELECT id FROM public.listings WHERE seller_id IN (SELECT id FROM demo_ids));

DELETE FROM public.listings WHERE seller_id IN (SELECT id FROM demo_ids);
DELETE FROM public.profiles WHERE id IN (SELECT id FROM demo_ids);
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM demo_ids);
DELETE FROM auth.users WHERE id IN (SELECT id FROM demo_ids);

CREATE TEMP TABLE demo_accounts (
  id uuid PRIMARY KEY,
  username text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  password text NOT NULL,
  residence text,
  bio text,
  meetups text[],
  created_at timestamptz NOT NULL
);

INSERT INTO demo_accounts
  (id, username, full_name, role, password, residence, bio, meetups, created_at)
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'kai.lam', 'Kai Lam', 'seller', 'KaiLam26Hkust', NULL,
    'Year-3 COMP. Selling notes after each term so they do not pile up.',
    ARRAY['Library Entrance', 'Academic Building Atrium'], now() - interval '21 days'),
  ('a1000000-0000-4000-8000-000000000002', 'sofiapeng', 'Sofia Peng', 'seller', 'Sofia26Hkust', NULL,
    'Hall V. Cables, calculators, and small electronics I no longer need.',
    ARRAY['Hall IX Lobby', 'Library Entrance'], now() - interval '20 days'),
  ('a1000000-0000-4000-8000-000000000003', 'noman.chow', 'Noman Chow', 'seller', 'Noman26Hkust', NULL,
    'Moving out of Hall IX next month — dorm furniture and giveaways.',
    ARRAY['Hall I Lobby', 'Hall IX Lobby'], now() - interval '18 days'),
  ('a1000000-0000-4000-8000-000000000004', 'aisha.rahman', 'Aisha Rahman', 'seller', 'Aisha26Hkust', NULL,
    'Jockey Club Hall. Clothes and leftover orientation merch.',
    ARRAY['Academic Building Atrium', 'Seafront Cafeteria'], now() - interval '17 days'),
  ('a1000000-0000-4000-8000-000000000005', 'tomo.sato', 'Tomo Sato', 'seller', 'Tomo26Hkust', NULL,
    'PG outdoor club. Lend gear for the weekend, sell what I upgraded.',
    ARRAY['North Gate', 'South Gate'], now() - interval '15 days'),
  ('a2000000-0000-4000-8000-000000000001', 'wong.mei', 'Wong Mei', 'buyer', 'MeiWong26Hkust', 'Hall I', NULL, '{}', now() - interval '14 days'),
  ('a2000000-0000-4000-8000-000000000002', 'jason.ng', 'Jason Ng', 'buyer', 'Jason26Hkust', 'Hall II', NULL, '{}', now() - interval '14 days'),
  ('a2000000-0000-4000-8000-000000000003', 'priya.sharma', 'Priya Sharma', 'buyer', 'Priya26Hkust', 'Hall III', NULL, '{}', now() - interval '12 days'),
  ('a2000000-0000-4000-8000-000000000004', 'lucas.ho', 'Lucas Ho', 'buyer', 'Lucas26Hkust', 'Hall IV', NULL, '{}', now() - interval '11 days'),
  ('a2000000-0000-4000-8000-000000000005', 'emily.wu', 'Emily Wu', 'buyer', 'Emily26Hkust', 'Hall VI', NULL, '{}', now() - interval '10 days'),
  ('a2000000-0000-4000-8000-000000000006', 'david.kwok', 'David Kwok', 'buyer', 'David26Hkust', 'Hall VII', NULL, '{}', now() - interval '9 days'),
  ('a2000000-0000-4000-8000-000000000007', 'hana.kim', 'Hana Kim', 'buyer', 'Hana26Hkust', 'Hall VIII', NULL, '{}', now() - interval '4 days'),
  ('a2000000-0000-4000-8000-000000000008', 'brian.lau', 'Brian Lau', 'buyer', 'Brian26Hkust', 'Off-campus', NULL, '{}', now() - interval '8 days');

-- Do not ALTER auth.users (SQL Editor is not the table owner → 42501).
-- INSERT fires public.handle_new_user, which creates profiles from raw_user_meta_data.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  coalesce(
    (SELECT u.instance_id FROM auth.users u WHERE lower(u.email) = 'admin@ust.hk' LIMIT 1),
    '00000000-0000-0000-0000-000000000000'
  ),
  a.id,
  'authenticated',
  'authenticated',
  a.username || '@users.hkust-marketplace.local',
  extensions.crypt(a.password, extensions.gen_salt('bf')),
  a.created_at,
  a.created_at + interval '6 hours',
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object(
    'username', a.username,
    'full_name', a.full_name,
    'role', a.role,
    'residence', coalesce(a.residence, ''),
    'bio', coalesce(a.bio, ''),
    'meetups', to_jsonb(a.meetups)
  ),
  a.created_at,
  a.created_at,
  '', '', '', ''
FROM demo_accounts a;

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
SELECT
  a.id,
  a.id,
  a.id::text,
  jsonb_build_object(
    'sub', a.id::text,
    'email', a.username || '@users.hkust-marketplace.local',
    'email_verified', true
  ),
  'email',
  a.created_at,
  a.created_at,
  a.created_at
FROM demo_accounts a;

UPDATE public.profiles p
SET
  residence = a.residence,
  bio = a.bio,
  meetup_locations = a.meetups,
  created_at = a.created_at
FROM demo_accounts a
WHERE p.id = a.id;

DELETE FROM public.notifications
WHERE title = 'New account registered'
  AND message ~ '@(kai\.lam|sofiapeng|noman\.chow|aisha\.rahman|tomo\.sato|wong\.mei|jason\.ng|priya\.sharma|lucas\.ho|emily\.wu|david\.kwok|hana\.kim|brian\.lau)';

CREATE OR REPLACE FUNCTION pg_temp.photo(label text, bg text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'data:image/svg+xml;charset=utf-8,' ||
    replace(replace(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="'
      || bg || '"/><text x="400" y="310" text-anchor="middle" fill="white" font-size="28" font-family="sans-serif">'
      || label || '</text></svg>',
      '#', '%23'
    ), ' ', '%20');
$$;

ALTER TABLE public.listings DISABLE TRIGGER listings_inserted;
ALTER TABLE public.chat_messages DISABLE TRIGGER chat_messages_notify;

INSERT INTO public.listings (
  seller_id, title, category, listing_type, condition, description, price,
  lending_duration_value, lending_duration_unit, meetup_location, photos, status,
  rejection_reason, view_count, created_at, updated_at
) VALUES
  -- kai.lam textbooks
  ('a1000000-0000-4000-8000-000000000001', 'COMP3111 Software Engineering notes', 'Books & Course Materials', 'sell', 'Used',
    'Full semester handwritten notes plus the sample project plan. Highlighted, no missing pages. Meet at the library after 6pm.',
    80, NULL, NULL, 'Library Entrance', ARRAY[pg_temp.photo('COMP3111 notes', '#073763')], 'sold', NULL, 64, now() - interval '19 days', now() - interval '12 days'),
  ('a1000000-0000-4000-8000-000000000001', 'COMP3511 Operating Systems textbook', 'Books & Course Materials', 'sell', 'Like New',
    'International edition, barely used for one term. No writing inside. Can include my chapter 3–5 summary sheets if you want them.',
    220, NULL, NULL, 'Academic Building Atrium', ARRAY[pg_temp.photo('COMP3511 book', '#0b477f')], 'live', NULL, 41, now() - interval '16 days', now() - interval '2 days'),
  ('a1000000-0000-4000-8000-000000000001', 'MATH2111 Linear Algebra notes', 'Books & Course Materials', 'sell', 'Used',
    'Scanned and printed notes from last fall. Neat enough to study from. Waiting on admin review before this goes live.',
    45, NULL, NULL, 'Library Entrance', ARRAY[pg_temp.photo('MATH2111', '#073763')], 'pending', NULL, 3, now() - interval '1 day', now() - interval '1 day'),
  ('a1000000-0000-4000-8000-000000000001', 'PHYS1112 lab manual (annotated)', 'Books & Course Materials', 'sell', 'Used',
    'Lab manual with pencil answers in the margins. Admin rejected because the photos were unclear — I will resubmit.',
    30, NULL, NULL, 'Academic Building Atrium', ARRAY[pg_temp.photo('PHYS1112', '#68788a')], 'rejected',
    'Photos are too dark to confirm the edition. Please upload a clearer cover shot and resubmit.', 8, now() - interval '9 days', now() - interval '8 days'),

  -- sofiapeng electronics
  ('a1000000-0000-4000-8000-000000000002', 'Casio fx-50FH calculator', 'Electronics', 'sell', 'Like New',
    'Exam-legal Casio. Original case included. Battery replaced this month. Prefer cash at Hall IX lobby.',
    150, NULL, NULL, 'Hall IX Lobby', ARRAY[pg_temp.photo('Casio fx-50FH', '#267458')], 'reserved', NULL, 55, now() - interval '18 days', now() - interval '2 days'),
  ('a1000000-0000-4000-8000-000000000002', 'USB-C 7-in-1 hub', 'Electronics', 'sell', 'Used',
    'HDMI, USB-A, SD, and PD charging. Works with my MacBook. Light scuffs on the aluminium shell.',
    90, NULL, NULL, 'Library Entrance', ARRAY[pg_temp.photo('USB-C hub', '#0b477f')], 'live', NULL, 27, now() - interval '11 days', now() - interval '1 day'),
  ('a1000000-0000-4000-8000-000000000002', 'Logitech M720 mouse', 'Electronics', 'sell', 'Used',
    'Multi-device Bluetooth mouse. Scroll wheel still smooth. Unifying receiver in the box.',
    75, NULL, NULL, 'Library Entrance', ARRAY[pg_temp.photo('Logitech mouse', '#14263a')], 'sold', NULL, 19, now() - interval '13 days', now() - interval '6 days'),
  ('a1000000-0000-4000-8000-000000000002', 'Monitor arm (single)', 'Electronics', 'lend', 'Used',
    'Clamp-on arm for a 27-inch screen. Borrow for a project week if your desk is tiny. I need it back before midterm week.',
    NULL, 1, 'Weeks', 'Hall IX Lobby', ARRAY[pg_temp.photo('Monitor arm', '#073763')], 'live', NULL, 14, now() - interval '7 days', now() - interval '7 days'),

  -- noman.chow dorm
  ('a1000000-0000-4000-8000-000000000003', 'IKEA desk lamp', 'Furniture & Home', 'sell', 'Used',
    'White clamp lamp, warm bulb included. No flicker. I am downsizing before hall checkout.',
    60, NULL, NULL, 'Hall IX Lobby', ARRAY[pg_temp.photo('Desk lamp', '#c6a15b')], 'live', NULL, 22, now() - interval '12 days', now() - interval '12 days'),
  ('a1000000-0000-4000-8000-000000000003', 'Folding laundry rack', 'Furniture & Home', 'giveaway', 'Used',
    'Free to a hall neighbour who will actually use it. A bit wobbly on one leg but it dries a full load.',
    NULL, NULL, NULL, 'Hall IX Lobby', ARRAY[pg_temp.photo('Laundry rack', '#68788a')], 'given', NULL, 18, now() - interval '10 days', now() - interval '6 days'),
  ('a1000000-0000-4000-8000-000000000003', 'Mini fridge (hall-safe)', 'Furniture & Home', 'sell', 'Used',
    '40L fridge, quiet enough for Hall IX. Defrosted and cleaned. Awaiting admin review.',
    400, NULL, NULL, 'Hall IX Lobby', ARRAY[pg_temp.photo('Mini fridge', '#0b477f')], 'pending', NULL, 6, now() - interval '20 hours', now() - interval '20 hours'),

  -- aisha.rahman fashion / merch
  ('a1000000-0000-4000-8000-000000000004', 'Black winter coat (M)', 'Fashion & Accessories', 'sell', 'Like New',
    'Uniqlo blocktech, size M, worn one winter. No stains. Good for the wind on LG7.',
    120, NULL, NULL, 'Academic Building Atrium', ARRAY[pg_temp.photo('Winter coat', '#14263a')], 'sold', NULL, 31, now() - interval '14 days', now() - interval '5 days'),
  ('a1000000-0000-4000-8000-000000000004', 'HKUST orientation tote bags', 'Fashion & Accessories', 'giveaway', 'New',
    'Two leftover orientation totes, never used. First claim wins — still live for the demo.',
    NULL, NULL, NULL, 'Seafront Cafeteria', ARRAY[pg_temp.photo('UST totes', '#c6a15b')], 'live', NULL, 9, now() - interval '3 days', now() - interval '3 days'),
  ('a1000000-0000-4000-8000-000000000004', 'Formal shoes size 38', 'Fashion & Accessories', 'sell', 'Used',
    'Black office shoes, size 38. Worn to two career fairs. Soles still even.',
    70, NULL, NULL, 'Academic Building Atrium', ARRAY[pg_temp.photo('Formal shoes', '#073763')], 'live', NULL, 11, now() - interval '8 days', now() - interval '8 days'),
  ('a1000000-0000-4000-8000-000000000004', 'Free AirPods (urgent!!)', 'Electronics', 'sell', 'New',
    'Brand new AirPods, selling for $50 because I am leaving tonight. Meet anywhere. (Demo listing for report / take-down.)',
    50, NULL, NULL, 'North Gate', ARRAY[pg_temp.photo('AirPods??', '#9b2c2c')], 'live', NULL, 47, now() - interval '2 days', now() - interval '2 days'),

  -- tomo.sato outdoors
  ('a1000000-0000-4000-8000-000000000005', '2-person tent', 'Sports & Outdoors', 'lend', 'Used',
    'Decathlon tent, rain-tested. Currently out with a borrower until the weekend. Pickup at North Gate.',
    NULL, 3, 'Days', 'North Gate', ARRAY[pg_temp.photo('2-person tent', '#267458')], 'lent', NULL, 36, now() - interval '13 days', now() - interval '2 days'),
  ('a1000000-0000-4000-8000-000000000005', 'Badminton racket set', 'Sports & Outdoors', 'lend', 'Used',
    'Two rackets and a tube of shuttles. Already borrowed and returned once this month.',
    NULL, 1, 'Weeks', 'South Gate', ARRAY[pg_temp.photo('Badminton set', '#0b477f')], 'live', NULL, 16, now() - interval '12 days', now() - interval '3 days'),
  ('a1000000-0000-4000-8000-000000000005', 'Carbon hiking poles', 'Sports & Outdoors', 'sell', 'Like New',
    'Pair of collapsible poles, used on one Sai Kung weekend. Tips still sharp.',
    180, NULL, NULL, 'North Gate', ARRAY[pg_temp.photo('Hiking poles', '#073763')], 'live', NULL, 13, now() - interval '6 days', now() - interval '6 days'),
  ('a1000000-0000-4000-8000-000000000005', 'Camping stove + gas', 'Sports & Outdoors', 'giveaway', 'Used',
    'Old but working stove and a half canister. Free if you take both. Still available.',
    NULL, NULL, NULL, 'South Gate', ARRAY[pg_temp.photo('Camping stove', '#c6a15b')], 'live', NULL, 7, now() - interval '5 days', now() - interval '5 days');

-- Offers / claims / borrows
INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000001', 'offer', 'completed', 80, NULL, NULL,
  'Paid cash at Library Entrance after lab.', now() - interval '12 days', now() - interval '13 days', now() - interval '12 days'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000001' AND l.title = 'COMP3111 Software Engineering notes';

INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000004', 'offer', 'pending', 200, NULL, NULL,
  'Would you take $200 if I collect tomorrow?', NULL, now() - interval '2 days', now() - interval '2 days'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000001' AND l.title = 'COMP3511 Operating Systems textbook';

INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000003', 'offer', 'accepted', 150, NULL, NULL,
  'Asking price is fine. Meet Hall IX lobby Friday 7pm.', NULL, now() - interval '3 days', now() - interval '2 days'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000002' AND l.title = 'Casio fx-50FH calculator';

INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000001', 'offer', 'countered', 80, NULL, NULL,
  'Seller countered at $80 (buyer offered $70).', NULL, now() - interval '1 day', now() - interval '12 hours'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000002' AND l.title = 'USB-C 7-in-1 hub';

INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000005', 'offer', 'completed', 75, NULL, NULL,
  'Collected at the library. Mouse works.', now() - interval '6 days', now() - interval '8 days', now() - interval '6 days'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000002' AND l.title = 'Logitech M720 mouse';

INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000007', 'borrow', 'pending', NULL,
  now() + interval '1 day', now() + interval '8 days',
  'Need it for a group project week. Can collect tomorrow evening.', NULL, now() - interval '6 hours', now() - interval '6 hours'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000002' AND l.title = 'Monitor arm (single)';

INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000002', 'offer', 'pending', 55, NULL, NULL,
  'Can do $55 today if still available.', NULL, now() - interval '8 hours', now() - interval '8 hours'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000003' AND l.title = 'IKEA desk lamp';

INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000002', 'claim', 'completed', NULL, NULL, NULL,
  'First to claim. Picked up at Hall IX lobby.', now() - interval '6 days', now() - interval '7 days', now() - interval '6 days'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000003' AND l.title = 'Folding laundry rack';

INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000008', 'offer', 'completed', 120, NULL, NULL,
  'Met at the atrium between lectures.', now() - interval '5 days', now() - interval '7 days', now() - interval '5 days'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000004' AND l.title = 'Black winter coat (M)';

INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000006', 'borrow', 'accepted', NULL,
  now() - interval '2 days', now() + interval '2 days',
  'Camping this weekend. Will return Sunday evening at North Gate.', NULL, now() - interval '3 days', now() - interval '2 days'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000005' AND l.title = '2-person tent';

INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000003', 'borrow', 'returned', NULL,
  now() - interval '10 days', now() - interval '3 days',
  'Returned on time with the shuttle tube still full.', now() - interval '3 days', now() - interval '11 days', now() - interval '3 days'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000005' AND l.title = 'Badminton racket set';

INSERT INTO public.offers (listing_id, buyer_id, kind, status, price, start_at, end_at, detail, completed_at, created_at, updated_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000004', 'offer', 'declined', 140, NULL, NULL,
  'Offered $140. Seller wants closer to asking.', now() - interval '4 days', now() - interval '5 days', now() - interval '4 days'
FROM public.listings l WHERE l.seller_id = 'a1000000-0000-4000-8000-000000000005' AND l.title = 'Carbon hiking poles';

-- Chats
INSERT INTO public.chat_threads (listing_id, buyer_id, seller_id, created_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000004', l.seller_id, now() - interval '2 days'
FROM public.listings l WHERE l.title = 'COMP3511 Operating Systems textbook';

INSERT INTO public.chat_threads (listing_id, buyer_id, seller_id, created_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000003', l.seller_id, now() - interval '3 days'
FROM public.listings l WHERE l.title = 'Casio fx-50FH calculator';

INSERT INTO public.chat_threads (listing_id, buyer_id, seller_id, created_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000006', l.seller_id, now() - interval '3 days'
FROM public.listings l WHERE l.title = '2-person tent';

INSERT INTO public.chat_threads (listing_id, buyer_id, seller_id, created_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000008', l.seller_id, now() - interval '7 days'
FROM public.listings l WHERE l.title = 'Black winter coat (M)';

INSERT INTO public.chat_messages (thread_id, sender_id, body, kind, created_at)
SELECT t.id, 'a2000000-0000-4000-8000-000000000004',
  'Hi Kai — is the COMP3511 book the international edition? Can you include the solution sketches for chapters 3–5?',
  'message', now() - interval '2 days'
FROM public.chat_threads t
JOIN public.listings l ON l.id = t.listing_id
WHERE l.title = 'COMP3511 Operating Systems textbook';

INSERT INTO public.chat_messages (thread_id, sender_id, body, kind, created_at)
SELECT t.id, 'a1000000-0000-4000-8000-000000000001',
  'Yes, international edition. I can include the sketches. $220 still ok, or see my reply to your $200 offer.',
  'message', now() - interval '2 days' + interval '40 minutes'
FROM public.chat_threads t
JOIN public.listings l ON l.id = t.listing_id
WHERE l.title = 'COMP3511 Operating Systems textbook';

INSERT INTO public.chat_messages (thread_id, sender_id, body, kind, created_at)
SELECT t.id, 'a2000000-0000-4000-8000-000000000004',
  'I will think overnight. Atrium after 5pm works for me.',
  'message', now() - interval '1 day'
FROM public.chat_threads t
JOIN public.listings l ON l.id = t.listing_id
WHERE l.title = 'COMP3511 Operating Systems textbook';

INSERT INTO public.chat_messages (thread_id, sender_id, body, kind, created_at)
SELECT t.id, 'a2000000-0000-4000-8000-000000000003',
  'Can you hold the Casio until Friday 7pm? I have a quiz before that.',
  'message', now() - interval '2 days' - interval '3 hours'
FROM public.chat_threads t
JOIN public.listings l ON l.id = t.listing_id
WHERE l.title = 'Casio fx-50FH calculator';

INSERT INTO public.chat_messages (thread_id, sender_id, body, kind, created_at)
SELECT t.id, 'a1000000-0000-4000-8000-000000000002',
  'Yes — I accepted the offer. Hall IX lobby, Friday 7pm. Bring cash.',
  'message', now() - interval '2 days'
FROM public.chat_threads t
JOIN public.listings l ON l.id = t.listing_id
WHERE l.title = 'Casio fx-50FH calculator';

INSERT INTO public.chat_messages (thread_id, sender_id, body, kind, created_at)
SELECT t.id, 'a2000000-0000-4000-8000-000000000006',
  'Tent is packed. Any missing pegs I should know about before Sai Kung?',
  'message', now() - interval '2 days'
FROM public.chat_threads t
JOIN public.listings l ON l.id = t.listing_id
WHERE l.title = '2-person tent';

INSERT INTO public.chat_messages (thread_id, sender_id, body, kind, created_at)
SELECT t.id, 'a1000000-0000-4000-8000-000000000005',
  'All pegs are in the side pocket. Please dry it if it rains before Sunday return.',
  'message', now() - interval '2 days' + interval '25 minutes'
FROM public.chat_threads t
JOIN public.listings l ON l.id = t.listing_id
WHERE l.title = '2-person tent';

INSERT INTO public.chat_messages (thread_id, sender_id, body, kind, created_at)
SELECT t.id, 'a2000000-0000-4000-8000-000000000008',
  'Does the coat have a hood? I bike from Hang Hau.',
  'message', now() - interval '7 days'
FROM public.chat_threads t
JOIN public.listings l ON l.id = t.listing_id
WHERE l.title = 'Black winter coat (M)';

INSERT INTO public.chat_messages (thread_id, sender_id, body, kind, created_at)
SELECT t.id, 'a1000000-0000-4000-8000-000000000004',
  'Yes, hooded. See you at the atrium.',
  'message', now() - interval '7 days' + interval '15 minutes'
FROM public.chat_threads t
JOIN public.listings l ON l.id = t.listing_id
WHERE l.title = 'Black winter coat (M)';

-- Ratings (one per completed deal)
INSERT INTO public.ratings (offer_id, buyer_id, seller_id, stars, review_text, seller_reply, replied_at, flagged, flag_reason, created_at)
SELECT o.id, o.buyer_id, l.seller_id, 5,
  'Notes were complete and Kai met on time at the library. Easy deal.',
  'Thanks Mei — glad they helped for the midterm.',
  now() - interval '11 days',
  false, NULL, now() - interval '11 days'
FROM public.offers o
JOIN public.listings l ON l.id = o.listing_id
WHERE o.buyer_id = 'a2000000-0000-4000-8000-000000000001' AND l.title = 'COMP3111 Software Engineering notes';

INSERT INTO public.ratings (offer_id, buyer_id, seller_id, stars, review_text, seller_reply, replied_at, flagged, flag_reason, created_at)
SELECT o.id, o.buyer_id, l.seller_id, 4,
  'Mouse works. Pairing took a minute but Sofia was patient.',
  NULL, NULL, false, NULL, now() - interval '5 days'
FROM public.offers o
JOIN public.listings l ON l.id = o.listing_id
WHERE o.buyer_id = 'a2000000-0000-4000-8000-000000000005' AND l.title = 'Logitech M720 mouse';

INSERT INTO public.ratings (offer_id, buyer_id, seller_id, stars, review_text, seller_reply, replied_at, flagged, flag_reason, created_at)
SELECT o.id, o.buyer_id, l.seller_id, 5,
  'Rackets were as described. Returned to South Gate with no issues.',
  'Anytime — book again before the hall tournament.',
  now() - interval '2 days',
  false, NULL, now() - interval '3 days'
FROM public.offers o
JOIN public.listings l ON l.id = o.listing_id
WHERE o.buyer_id = 'a2000000-0000-4000-8000-000000000003' AND l.title = 'Badminton racket set';

INSERT INTO public.ratings (offer_id, buyer_id, seller_id, stars, review_text, seller_reply, replied_at, flagged, flag_reason, created_at)
SELECT o.id, o.buyer_id, l.seller_id, 2,
  'Coat is thinner than the photos suggested. Still wearable.',
  NULL, NULL, true, 'Misleading: photos look like a heavier coat than what arrived.',
  now() - interval '4 days'
FROM public.offers o
JOIN public.listings l ON l.id = o.listing_id
WHERE o.buyer_id = 'a2000000-0000-4000-8000-000000000008' AND l.title = 'Black winter coat (M)';

INSERT INTO public.listing_reports (listing_id, reporter_id, reason, created_at)
SELECT l.id, 'a2000000-0000-4000-8000-000000000008',
  'Looks like a scam — $50 AirPods and “leaving tonight” wording.',
  now() - interval '1 day'
FROM public.listings l WHERE l.title = 'Free AirPods (urgent!!)';

-- Curated notifications (triggers were off so the inbox is not 40 copies of the same event)
INSERT INTO public.notifications (user_id, category, title, message, icon, tone, action, read_at, created_at)
SELECT p.id, 'Listing review', 'New listing awaiting review',
  '@kai.lam submitted “MATH2111 Linear Algebra notes” for approval.',
  'check', 'gold', 'Review listing', NULL, now() - interval '1 day'
FROM public.profiles p WHERE p.username = 'admin@ust.hk';

INSERT INTO public.notifications (user_id, category, title, message, icon, tone, action, read_at, created_at)
SELECT p.id, 'Listing review', 'New listing awaiting review',
  '@noman.chow submitted “Mini fridge (hall-safe)” for approval.',
  'check', 'gold', 'Review listing', NULL, now() - interval '20 hours'
FROM public.profiles p WHERE p.username = 'admin@ust.hk';

INSERT INTO public.notifications (user_id, category, title, message, icon, tone, action, read_at, created_at)
SELECT p.id, 'Listing review', 'Listing reported',
  '@brian.lau reported “Free AirPods (urgent!!)” as possible scam.',
  'inbox', 'red', 'Review listing', NULL, now() - interval '1 day'
FROM public.profiles p WHERE p.username = 'admin@ust.hk';

INSERT INTO public.notifications (user_id, category, title, message, icon, tone, action, read_at, created_at)
SELECT p.id, 'Ratings', 'Review flagged',
  'A 2-star review on @aisha.rahman was flagged for misleading photos.',
  'star', 'gold', 'View rating', NULL, now() - interval '4 days'
FROM public.profiles p WHERE p.username = 'admin@ust.hk';

INSERT INTO public.notifications (user_id, category, title, message, icon, tone, action, read_at, created_at)
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Offers', 'New offer',
    '@lucas.ho offered $200 on “COMP3511 Operating Systems textbook”.', 'inbox', 'navy', 'View offer', NULL, now() - interval '2 days'),
  ('a1000000-0000-4000-8000-000000000001', 'Chat', 'New message from @lucas.ho',
    'Hi Kai — is the COMP3511 book the international edition? Can you include the solution sketches for chapters 3–5?',
    'message', 'navy', 'Open chat', now() - interval '1 day', now() - interval '2 days'),
  ('a1000000-0000-4000-8000-000000000002', 'Offers', 'Offer accepted',
    'You accepted @priya.sharma’s offer on the Casio calculator.', 'bag', 'green', 'View listing', now() - interval '1 day', now() - interval '2 days'),
  ('a1000000-0000-4000-8000-000000000002', 'Offers', 'Borrow request',
    '@hana.kim asked to borrow “Monitor arm (single)” for a week.', 'clock', 'gold', 'View offer', NULL, now() - interval '6 hours'),
  ('a1000000-0000-4000-8000-000000000003', 'Giveaway', 'Item claimed',
    '@jason.ng claimed “Folding laundry rack”.', 'bag', 'green', 'View listing', now() - interval '5 days', now() - interval '7 days'),
  ('a1000000-0000-4000-8000-000000000004', 'Ratings', 'New review',
    '@brian.lau left a 2-star review on “Black winter coat (M)”.', 'star', 'gold', 'View rating', NULL, now() - interval '4 days'),
  ('a1000000-0000-4000-8000-000000000005', 'Borrow reminder', 'Item on loan',
    '@david.kwok is borrowing “2-person tent” until this weekend.', 'clock', 'navy', 'View listing', now() - interval '1 day', now() - interval '2 days'),
  ('a2000000-0000-4000-8000-000000000001', 'Offers', 'Seller countered',
    '@sofiapeng countered your USB-C hub offer at $80.', 'inbox', 'gold', 'View offer', NULL, now() - interval '12 hours'),
  ('a2000000-0000-4000-8000-000000000001', 'Ratings', 'Seller replied',
    '@kai.lam replied to your review of the COMP3111 notes.', 'star', 'green', 'View rating', now() - interval '8 days', now() - interval '11 days'),
  ('a2000000-0000-4000-8000-000000000003', 'Offers', 'Offer accepted',
    '@sofiapeng accepted your Casio offer. Meet Hall IX lobby Friday 7pm.', 'bag', 'green', 'View listing', NULL, now() - interval '2 days'),
  ('a2000000-0000-4000-8000-000000000004', 'Offers', 'Offer declined',
    '@tomo.sato declined $140 on the hiking poles.', 'bag', 'red', 'View listing', now() - interval '3 days', now() - interval '4 days'),
  ('a2000000-0000-4000-8000-000000000006', 'Borrow reminder', 'Return this weekend',
    'Please return “2-person tent” to North Gate by Sunday evening.', 'clock', 'gold', 'View borrowed item', NULL, now() - interval '12 hours'),
  ('a2000000-0000-4000-8000-000000000007', 'Offers', 'Request sent',
    'Your borrow request for “Monitor arm (single)” is waiting on @sofiapeng.', 'clock', 'navy', 'View listing', NULL, now() - interval '6 hours');

ALTER TABLE public.listings ENABLE TRIGGER listings_inserted;
ALTER TABLE public.chat_messages ENABLE TRIGGER chat_messages_notify;

COMMIT;
