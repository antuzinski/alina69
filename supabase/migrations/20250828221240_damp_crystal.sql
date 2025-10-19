-- Setup Supabase Storage for images
-- Create bucket and policies for image uploads

-- 1) Create bucket 'images' (private bucket with signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images', 
  false,  -- private bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2) Clean up existing policies first
DROP POLICY IF EXISTS "images_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "images_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "images_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "images_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read images" ON storage.objects;

-- 3) Create new policies for authenticated users
CREATE POLICY "images_select_authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'images');

CREATE POLICY "images_insert_authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "images_update_authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

CREATE POLICY "images_delete_authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'images');