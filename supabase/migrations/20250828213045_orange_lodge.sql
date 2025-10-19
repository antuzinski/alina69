/*
  # Add content type filtering to folders

  1. New Columns
    - `content_types` (text array) - which content types this folder accepts
    - Default: all types allowed (empty array means no restrictions)

  2. Security
    - Update existing policies to handle new column
*/

-- Add content_types column to folders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'folders' AND column_name = 'content_types'
  ) THEN
    ALTER TABLE folders ADD COLUMN content_types text[] DEFAULT '{}';
  END IF;
END $$;

-- Add index for content_types queries
CREATE INDEX IF NOT EXISTS folders_content_types_idx ON folders USING gin (content_types);