-- Follow-up after 003/005. Do not re-run 001, 003, or 005.
-- 1) Point each of the 19 seed listings at a photo that matches the item.
-- 2) Add extra live listings whose titles match the Figma Make Unsplash shots
--    (MacBook, headphones, bike, monitor) plus a few more campus items.
-- SQL Editor → paste this file → Run. Safe to re-run (extras upsert by title).

BEGIN;

ALTER TABLE public.listings DISABLE TRIGGER listings_inserted;

-- ---------------------------------------------------------------------------
-- A. Existing 19: keep titles; photos (+ light description) match the item
-- ---------------------------------------------------------------------------
UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-14565130808-af16490d7aa4?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Full semester handwritten notes plus the sample project plan. Photos show the notebook stack I will hand over. Highlighted, no missing pages. Meet at the library after 6pm.'
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
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Printed Linear Algebra notes from last fall with worked examples. Neat enough to study from. Waiting on admin review before this goes live.'
WHERE title = 'MATH2111 Linear Algebra notes';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1567427013427-4dd32984e371?auto=format&fit=crop&w=1200&q=85'
],
    description = 'PHYS1112 lab manual with pencil answers in the margins. Admin rejected the first photos — this resubmit shows the cover and lab bench copy I actually have.'
WHERE title = 'PHYS1112 lab manual (annotated)';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Exam-legal Casio scientific calculator (fx-50FH). Original case included. Battery replaced this month. Prefer cash at Hall IX lobby.'
WHERE title = 'Casio fx-50FH calculator';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1625948515291-69613efd103f?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1597872200969-c9e8031fe309?auto=format&fit=crop&w=1200&q=85'
],
    description = 'USB-C hub with HDMI, USB-A, SD, and PD charging. Works with my MacBook. Light scuffs on the aluminium shell.'
WHERE title = 'USB-C 7-in-1 hub';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Logitech M720 multi-device Bluetooth mouse. Scroll wheel still smooth. Unifying receiver in the box.'
WHERE title = 'Logitech M720 mouse';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Clamp-on monitor arm for a 27-inch screen (desk setup in photos). Borrow for a project week if your desk is tiny. I need it back before midterm week.'
WHERE title = 'Monitor arm (single)';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1507473887602-a8cfb2a90747?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=85'
],
    description = 'White desk lamp, warm bulb included. No flicker. I am downsizing before hall checkout.'
WHERE title = 'IKEA desk lamp';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1582735689369-4febe64fd4c5?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Folding laundry rack, free to a hall neighbour who will actually use it. A bit wobbly on one leg but it dries a full load.'
WHERE title = 'Folding laundry rack';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Compact fridge, quiet enough for Hall IX. Defrosted and cleaned. Awaiting admin review. Photos show the unit and interior shelves.'
WHERE title = 'Mini fridge (hall-safe)';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Black winter coat, size M, worn one winter. No stains. Hooded — good for the wind on LG7.'
WHERE title = 'Black winter coat (M)';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1590874103328-eac70a633ce8?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1547949003-9792a18a6b14?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Two leftover orientation tote bags, never used. Canvas totes as in the photos. First claim wins.'
WHERE title = 'HKUST orientation tote bags';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Black office shoes, size 38. Worn to two career fairs. Soles still even.'
WHERE title = 'Formal shoes size 38';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1600294037682-c4ba2234d0a6?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=85'
],
    description = 'AirPods in the charging case (photos). Selling cheap because I am leaving tonight. Meet anywhere. Flag this listing in the demo if it looks unsafe.'
WHERE title = 'Free AirPods (urgent!!)';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Decathlon 2-person tent, rain-tested. Currently out with a borrower until the weekend. Pickup at North Gate.'
WHERE title = '2-person tent';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Two badminton rackets and a tube of shuttles. Already borrowed and returned once this month.'
WHERE title = 'Badminton racket set';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1464822759023-d3aabff3c675?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Pair of collapsible carbon hiking poles (trail photos). Used on one Sai Kung weekend. Tips still sharp.'
WHERE title = 'Carbon hiking poles';

UPDATE public.listings
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1537905569824-f37dcdde7714?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=85'
],
    description = 'Camping stove and a half gas canister. Old but working. Free if you take both.'
WHERE title = 'Camping stove + gas';

-- ---------------------------------------------------------------------------
-- B. Extra listings: wording follows the Figma Make Unsplash galleries,
--    plus more campus items. Skip insert if the title already exists.
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
  -- Figma mock photos → matching product copy
  ('a1000000-0000-4000-8000-000000000002'::uuid,
   'MacBook Air M1, 2020', 'Electronics', 'sell', 'Used',
   '2020 MacBook Air M1, 8GB, 256GB. Light keyboard wear. Charger included. Photos are the actual silver Air on a desk.',
   4800::numeric, NULL::integer, NULL::text, 'Library Entrance',
   ARRAY[
     'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?auto=format&fit=crop&w=1200&q=85',
     'https://images.unsplash.com/photo-1625297671662-f073f2a91528?auto=format&fit=crop&w=1200&q=85',
     'https://images.unsplash.com/photo-1639413665566-2f75adf7b7ca?auto=format&fit=crop&w=1200&q=85'
   ],
   'live', 38, now() - interval '4 days', now() - interval '4 days'),
  ('a1000000-0000-4000-8000-000000000002',
   'Sony WH-1000XM4', 'Electronics', 'sell', 'Like New',
   'Sony WH-1000XM4 over-ears, black. Case and cable included. Noise cancelling still excellent for the library.',
   950, NULL, NULL, 'Hall IX Lobby',
   ARRAY[
     'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
     'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=1200&q=85',
     'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=85'
   ],
   'live', 29, now() - interval '6 days', now() - interval '6 days'),
  ('a1000000-0000-4000-8000-000000000005',
   'Road bike — weekend loan', 'Sports & Outdoors', 'lend', 'Used',
   'Hybrid road bike for a Sai Kung weekend. Helmet not included. Collect and return at North Gate.',
   NULL, 3, 'Days', 'North Gate',
   ARRAY[
     'https://images.unsplash.com/photo-1519219444773-9453a2f1f87c?auto=format&fit=crop&w=1200&q=85',
     'https://images.unsplash.com/photo-1584278140365-2ab8bff2be82?auto=format&fit=crop&w=1200&q=85',
     'https://images.unsplash.com/photo-1602517232715-c4a366f0ce1b?auto=format&fit=crop&w=1200&q=85'
   ],
   'live', 21, now() - interval '8 days', now() - interval '8 days'),
  ('a1000000-0000-4000-8000-000000000002',
   '27″ study monitor', 'Electronics', 'sell', 'Used',
   '27-inch IPS monitor, HDMI + DP. Stand included. Good for COMP labs at hall. Tiny scratch on the bezel.',
   1100, NULL, NULL, 'Library Entrance',
   ARRAY[
     'https://images.unsplash.com/photo-1570993492881-25240ce854f4?auto=format&fit=crop&w=1200&q=85',
     'https://images.unsplash.com/photo-1639413665566-2f75adf7b7ca?auto=format&fit=crop&w=1200&q=85'
   ],
   'live', 17, now() - interval '5 days', now() - interval '5 days'),
  ('a1000000-0000-4000-8000-000000000004',
   'Gold over-ear headphones', 'Electronics', 'sell', 'Used',
   'Gold/cream over-ear headphones as in the photos. 3.5mm jack. Soft pads, light use.',
   180, NULL, NULL, 'Academic Building Atrium',
   ARRAY[
     'https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=1200&q=85',
     'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=1200&q=85'
   ],
   'live', 12, now() - interval '9 days', now() - interval '9 days'),
  ('a1000000-0000-4000-8000-000000000001',
   'COMP2012 OOP printed notes', 'Books & Course Materials', 'sell', 'Used',
   'Printed COMP2012 notes and past paper pack. Same notebook style as the photos. Some highlighter on week 4–6.',
   55, NULL, NULL, 'Academic Building Atrium',
   ARRAY[
     'https://images.unsplash.com/photo-1761546571631-a4d61b55cd2f?auto=format&fit=crop&w=1200&q=85',
     'https://images.unsplash.com/photo-1764096535068-0e9f652e03f6?auto=format&fit=crop&w=1200&q=85'
   ],
   'live', 15, now() - interval '7 days', now() - interval '7 days'),

  -- More campus items (photos match the copy)
  ('a1000000-0000-4000-8000-000000000003',
   'Electric kettle (hall)', 'Furniture & Home', 'sell', 'Used',
   '1.7L electric kettle. Auto-off works. Descaled last week. Meet Hall IX lobby.',
   80, NULL, NULL, 'Hall IX Lobby',
   ARRAY[
     'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=85'
   ],
   'live', 8, now() - interval '3 days', now() - interval '3 days'),
  ('a1000000-0000-4000-8000-000000000003',
   'Stainless water bottle 750ml', 'Sports & Outdoors', 'sell', 'Like New',
   'Insulated steel bottle. No dents. Fits the library side pocket.',
   45, NULL, NULL, 'Hall I Lobby',
   ARRAY[
     'https://images.unsplash.com/photo-1602143407151-01155ecc6d46?auto=format&fit=crop&w=1200&q=85'
   ],
   'live', 6, now() - interval '2 days', now() - interval '2 days'),
  ('a1000000-0000-4000-8000-000000000004',
   'Yoga mat (lend)', 'Sports & Outdoors', 'lend', 'Used',
   '6mm yoga mat. Cleaned after each use. Borrow for the week of the sports hall class.',
   NULL, 1, 'Weeks', 'Seafront Cafeteria',
   ARRAY[
     'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=85'
   ],
   'live', 5, now() - interval '1 day', now() - interval '1 day'),
  ('a1000000-0000-4000-8000-000000000002',
   'HDMI cable 2m', 'Electronics', 'giveaway', 'Used',
   'Spare HDMI 2.0 cable. Free if you collect at the library. Works with the 27″ monitor listing.',
   NULL, NULL, NULL, 'Library Entrance',
   ARRAY[
     'https://images.unsplash.com/photo-1597872200969-c9e8031fe309?auto=format&fit=crop&w=1200&q=85'
   ],
   'live', 4, now() - interval '12 hours', now() - interval '12 hours')
) AS v(seller_id, title, category, listing_type, condition, description, price,
       lending_duration_value, lending_duration_unit, meetup_location, photos, status,
       view_count, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.listings l WHERE l.title = v.title
);

ALTER TABLE public.listings ENABLE TRIGGER listings_inserted;

COMMIT;
