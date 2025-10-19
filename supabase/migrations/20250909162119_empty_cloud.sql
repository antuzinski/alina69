/*
  # Add media type support for images, GIFs and videos

  1. Changes
    - Add `media_type` column to items table to distinguish between image, gif, video
    - Update existing image items to have media_type = 'image'
    - Add index for better performance

  2. Media Types
    - 'image': JPG, PNG, WebP
    - 'gif': Animated GIFs  
    - 'video': MP4, WebM, MOV
*/

-- Add media_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE items ADD COLUMN media_type text DEFAULT 'image';
  END IF;
END $$;

-- Update existing image items to have media_type = 'image'
UPDATE items 
SET media_type = 'image' 
WHERE type = 'image' AND media_type IS NULL;

-- Add index for media_type
CREATE INDEX IF NOT EXISTS items_media_type_idx ON items(media_type);

-- Add constraint to ensure valid media types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_media_type_check'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_media_type_check 
    CHECK (media_type IN ('image', 'gif', 'video'));
  END IF;
END $$;