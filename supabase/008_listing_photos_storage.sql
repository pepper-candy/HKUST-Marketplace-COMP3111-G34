-- Follow-up after 001. Do not re-run 001–007.
-- Public Storage bucket for seller listing photos. SQL Editor → paste → Run.
-- Safe to re-run (bucket upsert + policies dropped/recreated).
-- App compresses in the browser (~1200px JPEG/WebP) then uploads; listings.photos
-- stores only the public URL. Existing Unsplash demo URLs are left as-is.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/webp', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/webp', 'image/png']::text[];

DROP POLICY IF EXISTS listing_photos_select ON storage.objects;
DROP POLICY IF EXISTS listing_photos_insert ON storage.objects;
DROP POLICY IF EXISTS listing_photos_update ON storage.objects;
DROP POLICY IF EXISTS listing_photos_delete ON storage.objects;

-- Anyone with the public URL can load the image (needed for <img src> and admin review).
CREATE POLICY listing_photos_select
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listing-photos');

-- Sellers (and admin adding on behalf) upload into their own folder: {auth.uid()}/file.
CREATE POLICY listing_photos_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-photos'
  AND split_part(name, '/', 1) = auth.uid()::text
  AND (
    public.current_profile_role() = 'seller'
    OR public.is_admin()
  )
);

CREATE POLICY listing_photos_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-photos'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR public.is_admin()
  )
)
WITH CHECK (
  bucket_id = 'listing-photos'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR public.is_admin()
  )
);

CREATE POLICY listing_photos_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-photos'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR public.is_admin()
  )
);

COMMIT;
