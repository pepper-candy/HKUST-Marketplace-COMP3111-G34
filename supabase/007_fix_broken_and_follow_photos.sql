-- Follow-up after 006. Do not re-run 001, 003, 005, or 006.
-- Many 006 Unsplash IDs 404 in the browser (naturalWidth 0) or show the wrong object
-- (kettle = coffee/cookies, hub = keyboard, tote/HDMI/AirPods/lamp/stove/bottle broken).
-- 1) Keep the original 19 titles (offers / demo path). Swap in URLs that actually load.
-- 2) Retitle 006 extras to follow the photo that loaded (or a verified replacement).
-- 3) Insert more live listings from leftover verified shots. More product is better.
-- SQL Editor → paste this file → Run. Safe to re-run (extras skip if the title exists).

BEGIN;

ALTER TABLE public.listings DISABLE TRIGGER listings_inserted;

-- ---------------------------------------------------------------------------
-- A. Original 19: titles stay; photos verified to load
-- ---------------------------------------------------------------------------
UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1761546571631-a4d61b55cd2f?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1764096535068-0e9f652e03f6?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Full semester handwritten notes plus the sample project plan. Cover is the notebook stack I will hand over. Highlighted, no missing pages. Meet at the library after 6pm.'
WHERE title = 'COMP3111 Software Engineering notes';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1200&q=85'
],
    description = 'International edition textbook, barely used for one term. No writing inside. Can include my chapter 3–5 summary sheets if you want them.'
WHERE title = 'COMP3511 Operating Systems textbook';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Printed Linear Algebra notes from last fall with worked examples. Cover is the formula-sheet style. Neat enough to study from. Waiting on admin review.'
WHERE title = 'MATH2111 Linear Algebra notes';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=85'
],
    description = 'PHYS1112 lab manual with pencil answers in the margins. Cover is the lab bench copy I actually used. Resubmitting after the first photos were too dark.'
WHERE title = 'PHYS1112 lab manual (annotated)';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Exam-legal Casio scientific calculator (fx-50FH). Original case included. Battery replaced this month. Prefer cash at Hall IX lobby.'
WHERE title = 'Casio fx-50FH calculator';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1625297671662-f073f2a91528?auto=format&fit=crop&w=1200&q=85'
],
    description = 'USB-C hub with HDMI, USB-A, SD, and PD charging. Cover is the MacBook I use it with. Light scuffs on the aluminium shell.'
WHERE title = 'USB-C 7-in-1 hub';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Logitech M720 multi-device Bluetooth mouse. Scroll wheel still smooth. Unifying receiver in the box.'
WHERE title = 'Logitech M720 mouse';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1551645120-d70bfe84c826?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Clamp-on monitor arm. Cover shows the 27-inch screen it holds on my hall desk. Borrow for a project week; I need it back before midterm week.'
WHERE title = 'Monitor arm (single)';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=1200&q=85'
],
    description = 'IKEA-style desk lamp, warm bulb included. No flicker. I am downsizing before hall checkout.'
WHERE title = 'IKEA desk lamp';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Folding laundry rack, free to a hall neighbour who will actually use it. Cover is the hall laundry room where it lives. A bit wobbly on one leg but it dries a full load.'
WHERE title = 'Folding laundry rack';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=1200&q=85'
],
    description = '40L hall-safe mini fridge, quiet enough for Hall IX. Defrosted and cleaned. Cover is the same teal colour; mine is the compact size, not a full kitchen unit. Awaiting admin review.'
WHERE title = 'Mini fridge (hall-safe)';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Winter coat, size M, worn one winter. No stains. Hooded — good for the wind on LG7. Cover shows the cut; mine is the black Uniqlo blocktech listed in the title.'
WHERE title = 'Black winter coat (M)';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Two leftover orientation tote bags, never used. Canvas totes as in the photo. First claim wins.'
WHERE title = 'HKUST orientation tote bags';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Brown leather oxfords, size 38. Worn to two career fairs. Soles still even.'
WHERE title = 'Formal shoes size 38';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=85'
],
    description = 'AirPods in the charging case (photos). Selling cheap because I am leaving tonight. Meet anywhere. Flag this listing in the demo if it looks unsafe.'
WHERE title = 'Free AirPods (urgent!!)';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Decathlon 2-person tent, rain-tested. Cover is the interior from last trip. Currently out with a borrower until the weekend. Pickup at North Gate.'
WHERE title = '2-person tent';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Two badminton rackets and a tube of shuttles. Cover is a session at the sports hall. Already borrowed and returned once this month.'
WHERE title = 'Badminton racket set';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Pair of collapsible carbon hiking poles. Cover is the Sai Kung weekend I used them. Tips still sharp.'
WHERE title = 'Carbon hiking poles';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1475483768296-6163e08872a1?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Camping stove and a half gas canister. Cover is the last campfire I cooked on with it. Old but working. Free if you take both.'
WHERE title = 'Camping stove + gas';

-- ---------------------------------------------------------------------------
-- B. 006 extras: follow the photo that actually loaded
-- ---------------------------------------------------------------------------
UPDATE public.listings
SET title = 'Spare ethernet cables (lab)',
    category = 'Electronics',
    listing_type = 'giveaway',
    condition = 'Used',
    photos = ARRAY[
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85'
    ],
    description = 'Leftover patch cables from a COMP lab rack. Free if you collect at the library. Mix of lengths, some already labelled.'
WHERE title = 'HDMI cable 2m';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Hall coffee corner leftover: grinder, pour-over, and stainless carafe. Auto-off kettle is the silver unit on the right. Meet Hall IX lobby.'
WHERE title = 'Electric kettle (hall)';

UPDATE public.listings
SET title = 'Yellow enamel coffee pot',
    category = 'Furniture & Home',
    listing_type = 'sell',
    condition = 'Used',
    photos = ARRAY[
      'https://images.unsplash.com/photo-1477003580086-917054ea8418?auto=format&fit=crop&w=1200&q=85'
    ],
    description = 'Yellow enamel stovetop pot as in the photo. Holds about 750ml. No dents. Fits a hall hot plate.'
WHERE title = 'Stainless water bottle 750ml';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=85'
],
    description = '6mm yoga mat. Cover is a seafront stretch on this mat. Cleaned after each use. Borrow for the week of the sports hall class.'
WHERE title = 'Yoga mat (lend)';

-- ---------------------------------------------------------------------------
-- C. More products from leftover verified shots (skip if title already exists)
-- ---------------------------------------------------------------------------
INSERT INTO public.listings (
  seller_id, title, category, listing_type, condition, description, price,
  lending_duration_value, lending_duration_unit, meetup_location, photos, status,
  view_count, created_at, updated_at
)
SELECT v.seller_id, v.title, v.category, v.listing_type, v.condition, v.description, v.price,
       v.lending_duration_value, v.lending_duration_unit, v.meetup_location, v.photos, v.status,
       v.view_count, v.created_at, v.updated_at
FROM (VALUES
  ('a1000000-0000-4000-8000-000000000003'::uuid,
   'Mug + cookies (hall snack)', 'Furniture & Home', 'sell', 'Used',
   'White mug and a tin of cookies as in the photo. Mug is dishwasher-safe. Meet Hall IX lobby.',
   25::numeric, NULL::integer, NULL::text, 'Hall IX Lobby',
   ARRAY['https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=85'],
   'live', 4, now() - interval '3 days', now() - interval '3 days'),

  ('a1000000-0000-4000-8000-000000000002',
   'Mechanical keyboard (60%)', 'Electronics', 'sell', 'Used',
   'Cream 60% mechanical keyboard, red accent escape key. As in the photo. USB-C cable included.',
   320, NULL, NULL, 'Library Entrance',
   ARRAY['https://images.unsplash.com/photo-1625948515291-69613efd103f?auto=format&fit=crop&w=1200&q=85'],
   'live', 11, now() - interval '4 days', now() - interval '4 days'),

  ('a1000000-0000-4000-8000-000000000002',
   'RGB backlit keyboard', 'Electronics', 'sell', 'Used',
   'Full-size RGB keyboard. Blue lighting as in the photo. Some shine on WASD. USB.',
   140, NULL, NULL, 'Library Entrance',
   ARRAY['https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=1200&q=85'],
   'live', 7, now() - interval '5 days', now() - interval '5 days'),

  ('a1000000-0000-4000-8000-000000000004',
   'Floral heels size 38', 'Fashion & Accessories', 'sell', 'Like New',
   'Blue floral pumps, size 38. Worn once to a faculty dinner. As in the photos.',
   90, NULL, NULL, 'Academic Building Atrium',
   ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=85'],
   'live', 5, now() - interval '6 days', now() - interval '6 days'),

  ('a1000000-0000-4000-8000-000000000004',
   'Camel wool coat (M)', 'Fashion & Accessories', 'sell', 'Used',
   'Camel belted wool coat, size M. Worn one winter. As in the photo. Good for LG7 wind.',
   180, NULL, NULL, 'Academic Building Atrium',
   ARRAY['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=85'],
   'live', 9, now() - interval '8 days', now() - interval '8 days'),

  ('a1000000-0000-4000-8000-000000000004',
   'Brown bomber jacket', 'Fashion & Accessories', 'sell', 'Like New',
   'Rust bomber, size M. Light use. As in the photo. Hall-friendly, not a heavy winter coat.',
   110, NULL, NULL, 'Academic Building Atrium',
   ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85'],
   'live', 6, now() - interval '7 days', now() - interval '7 days'),

  ('a1000000-0000-4000-8000-000000000002',
   'iMac 21.5″ (hall desk)', 'Electronics', 'sell', 'Used',
   '21.5-inch iMac as in the photo. Keyboard and mouse included. Fine for COMP labs at hall.',
   2200, NULL, NULL, 'Library Entrance',
   ARRAY['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85'],
   'live', 14, now() - interval '9 days', now() - interval '9 days'),

  ('a1000000-0000-4000-8000-000000000004',
   'Pink chain bag', 'Fashion & Accessories', 'sell', 'Like New',
   'Pink and cream chain bag as in the photo. Fits a phone and Octopus. Worn twice.',
   65, NULL, NULL, 'Seafront Cafeteria',
   ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1200&q=85'],
   'live', 3, now() - interval '2 days', now() - interval '2 days'),

  ('a1000000-0000-4000-8000-000000000004',
   'Red structured handbag', 'Fashion & Accessories', 'sell', 'Used',
   'Red lock-clasp handbag as in the photo. Holds a 14-inch sleeve if you squeeze. Light scuffs on the base.',
   95, NULL, NULL, 'Academic Building Atrium',
   ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85'],
   'live', 4, now() - interval '10 days', now() - interval '10 days'),

  ('a1000000-0000-4000-8000-000000000002',
   'Black wireless earbuds', 'Electronics', 'sell', 'Used',
   'Black true-wireless earbuds and case as in the photo. Charging cable included. Not AirPods.',
   80, NULL, NULL, 'Hall IX Lobby',
   ARRAY['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=85'],
   'live', 8, now() - interval '4 days', now() - interval '4 days'),

  ('a1000000-0000-4000-8000-000000000002',
   'Green wireless earbuds', 'Electronics', 'sell', 'Like New',
   'Green true-wireless earbuds on a red desk, as in the photo. Case + cable. Light gym use.',
   70, NULL, NULL, 'Library Entrance',
   ARRAY['https://images.unsplash.com/photo-1606400082777-ef05f3c5cde2?auto=format&fit=crop&w=1200&q=85'],
   'live', 5, now() - interval '3 days', now() - interval '3 days'),

  ('a1000000-0000-4000-8000-000000000004',
   'Nike sneakers (used)', 'Fashion & Accessories', 'sell', 'Used',
   'Brown Nike low-tops as in the photo. Size 38–39 fit. Creases on the toebox, soles still grippy.',
   120, NULL, NULL, 'North Gate',
   ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85'],
   'live', 10, now() - interval '11 days', now() - interval '11 days'),

  ('a1000000-0000-4000-8000-000000000002',
   'Old PC CPU pull', 'Electronics', 'giveaway', 'For Parts',
   'CPU pulled from a retired hall PC. Cover is the board it came off. Free if you collect at the library. No cooler.',
   NULL, NULL, NULL, 'Library Entrance',
   ARRAY['https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=1200&q=85'],
   'live', 2, now() - interval '16 hours', now() - interval '16 hours'),

  ('a1000000-0000-4000-8000-000000000002',
   'Hall desk gadget leftover', 'Electronics', 'sell', 'Used',
   'Clearing my desk: laptop stand era leftover. Cover is the setup — MacBook, LG monitor, iPad, phone, AirPods. Selling the monitor + cables only; laptop not included.',
   900, NULL, NULL, 'Library Entrance',
   ARRAY['https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=1200&q=85'],
   'live', 13, now() - interval '6 days', now() - interval '6 days'),

  ('a1000000-0000-4000-8000-000000000002',
   'Gaming PC + monitor', 'Electronics', 'sell', 'Used',
   'Tower, monitor, RGB keyboard as in the photo. Mouse included. Heavy — collect at Library Entrance with a trolley if you can.',
   3800, NULL, NULL, 'Library Entrance',
   ARRAY['https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=85'],
   'live', 16, now() - interval '12 days', now() - interval '12 days'),

  ('a1000000-0000-4000-8000-000000000003',
   'Black shade desk lamp', 'Furniture & Home', 'sell', 'Used',
   'Black shade desk lamp as in the photo. Warm bulb works. I am keeping the wooden tripod one.',
   55, NULL, NULL, 'Hall IX Lobby',
   ARRAY['https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=1200&q=85'],
   'live', 3, now() - interval '2 days', now() - interval '2 days')
) AS v(seller_id, title, category, listing_type, condition, description, price,
       lending_duration_value, lending_duration_unit, meetup_location, photos, status,
       view_count, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.listings l WHERE l.title = v.title
);

ALTER TABLE public.listings ENABLE TRIGGER listings_inserted;

COMMIT;
