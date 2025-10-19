/*
  # Make images bucket public

  1. Storage Changes
    - Make the `images` bucket publicly accessible
    - Remove RLS policies that restrict access
    - Enable public URL access for all images

  2. Benefits
    - Permanent URLs without expiring tokens
    - Faster image loading (no signed URL generation)
    - Simpler code without token management

  3. Security Note
    - Images will be publicly accessible if someone knows the URL
    - For a personal catalog, this is usually acceptable
*/

-- Make the images bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'images';

-- Remove existing RLS policies on images bucket
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Create new public policies for the images bucket
CREATE POLICY "Public can view images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload to images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Authenticated users can update images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'images');