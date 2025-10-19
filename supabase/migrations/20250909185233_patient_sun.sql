/*
  # Add reactions field to items table

  1. Changes
    - Add `reactions` JSONB field to `items` table with default empty object
    - Add index for better performance on reactions queries

  2. Security
    - No changes to RLS policies needed - reactions inherit item permissions
*/

-- Add reactions field to items table
ALTER TABLE items 
ADD COLUMN reactions JSONB DEFAULT '{"heart": 0, "eyes": 0, "grinning": 0, "bird": 0}'::jsonb;

-- Add index for reactions queries
CREATE INDEX items_reactions_idx ON items USING gin (reactions);

-- Update existing items to have default reactions
UPDATE items 
SET reactions = '{"heart": 0, "eyes": 0, "grinning": 0, "bird": 0}'::jsonb 
WHERE reactions IS NULL;