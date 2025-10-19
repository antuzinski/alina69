/*
  # Add draft status to items

  1. Changes
    - Add `is_draft` boolean column to items table
    - Set default value to false for existing items
    - Add index for filtering drafts

  2. Security
    - No changes to RLS policies needed
*/

-- Add is_draft column to items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'is_draft'
  ) THEN
    ALTER TABLE items ADD COLUMN is_draft boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add index for draft filtering
CREATE INDEX IF NOT EXISTS items_is_draft_idx ON items (is_draft);

-- Add index for draft + type filtering
CREATE INDEX IF NOT EXISTS items_draft_type_idx ON items (is_draft, type);