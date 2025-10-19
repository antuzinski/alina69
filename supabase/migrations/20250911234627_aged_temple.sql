/*
  # Add video support to Supabase Storage

  1. Storage Configuration
    - Update bucket policies to allow video uploads
    - Add support for video MIME types
    - Configure proper file size limits for videos

  2. Security
    - Maintain RLS policies for authenticated users
    - Allow video file types: mp4, webm, mov, quicktime
*/

-- Update the images bucket to allow video files
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/mov'
  ],
  file_size_limit = 209715200 -- 200MB limit
WHERE id = 'images';

-- Ensure the bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'images',
  'images', 
  true,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/mov'
  ],
  209715200
)
ON CONFLICT (id) 
DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit,
  public = EXCLUDED.public;

-- Create storage policies for authenticated users
CREATE POLICY "Authenticated users can upload media files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Authenticated users can update media files" ON storage.objects  
FOR UPDATE TO authenticated
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can delete media files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'images');

CREATE POLICY "Public can view media files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');