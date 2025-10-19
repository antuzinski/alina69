/*
  # Setup Supabase Storage for images

  1. Storage Bucket
    - Create 'images' bucket (private)
    - Set file size limit to 10MB
    - Allow only image file types

  2. Security Policies
    - Authenticated users can upload/read/update/delete images
    - Use signed URLs for private access
*/

-- Create storage bucket for images (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images', 
  false, -- private bucket, requires signed URLs
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Clean up existing policies first
DROP POLICY IF EXISTS "images_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "images_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "images_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "images_delete_authenticated" ON storage.objects;

-- Create policies for authenticated users
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