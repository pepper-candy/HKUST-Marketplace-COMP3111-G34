-- Follow-up after 003: swap SVG placeholders for Figma Make mock listing photos (Unsplash).
-- Do not re-run 001 or 003. SQL Editor → paste this file → Run.
-- The Make export had no product files under src/ or public/ (only favicon.png).

BEGIN;

CREATE TEMP TABLE demo_photo (k text PRIMARY KEY, urls text[]);
INSERT INTO demo_photo (k, urls) VALUES
  ('notes', ARRAY[
    'https://images.unsplash.com/photo-1761546571631-a4d61b55cd2f?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1764096535068-0e9f652e03f6?auto=format&fit=crop&w=1200&q=85'
  ]),
  ('laptop', ARRAY[
    'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1625297671662-f073f2a91528?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1639413665566-2f75adf7b7ca?auto=format&fit=crop&w=1200&q=85'
  ]),
  ('headphones', ARRAY[
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=85'
  ]),
  ('gold_headphones', ARRAY[
    'https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=85'
  ]),
  ('bike', ARRAY[
    'https://images.unsplash.com/photo-1519219444773-9453a2f1f87c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1584278140365-2ab8bff2be82?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1602517232715-c4a366f0ce1b?auto=format&fit=crop&w=1200&q=85'
  ]),
  ('monitor', ARRAY[
    'https://images.unsplash.com/photo-1570993492881-25240ce854f4?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1639413665566-2f75adf7b7ca?auto=format&fit=crop&w=1200&q=85'
  ]);

UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'notes')
WHERE title = 'COMP3111 Software Engineering notes';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'notes')
WHERE title = 'COMP3511 Operating Systems textbook';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'notes')
WHERE title = 'MATH2111 Linear Algebra notes';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'notes')
WHERE title = 'PHYS1112 lab manual (annotated)';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'headphones')
WHERE title = 'Casio fx-50FH calculator';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'laptop')
WHERE title = 'USB-C 7-in-1 hub';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'laptop')
WHERE title = 'Logitech M720 mouse';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'monitor')
WHERE title = 'Monitor arm (single)';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'laptop')
WHERE title = 'IKEA desk lamp';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'bike')
WHERE title = 'Folding laundry rack';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'monitor')
WHERE title = 'Mini fridge (hall-safe)';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'bike')
WHERE title = 'Black winter coat (M)';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'notes')
WHERE title = 'HKUST orientation tote bags';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'bike')
WHERE title = 'Formal shoes size 38';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'gold_headphones')
WHERE title = 'Free AirPods (urgent!!)';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'bike')
WHERE title = '2-person tent';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'bike')
WHERE title = 'Badminton racket set';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'bike')
WHERE title = 'Carbon hiking poles';
UPDATE public.listings SET photos = (SELECT urls FROM demo_photo WHERE k = 'bike')
WHERE title = 'Camping stove + gas';

COMMIT;
