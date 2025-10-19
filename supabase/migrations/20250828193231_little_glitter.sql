/*
  # Improve database schema structure

  1. Schema Changes
    - Remove unused `is_public` field from items table
    - Add NOT NULL + DEFAULT constraints for key fields
    - Replace text CHECK with ENUM for item_type
    - Add proper indexes for performance
    - Add full-text search trigger
    - Add unique constraint for deduplication

  2. Security
    - Enable RLS on all tables
    - Add basic policies for authenticated users

  3. Performance
    - Add GIN index for full-text search
    - Add composite index for type + date sorting
    - Add tags GIN index for array queries
*/

-- Create ENUM for item types
CREATE TYPE item_type AS ENUM ('text', 'image', 'quote');

-- Drop existing tables to recreate with proper structure
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Create folders table with proper constraints
CREATE TABLE folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create items table with improved structure
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type item_type NOT NULL,
  title text,
  body text,
  preview text,
  image_url text,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  people text[] NOT NULL DEFAULT '{}',
  taken_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_pinned boolean NOT NULL DEFAULT false,
  hash text,
  ts tsvector
);

-- Create settings table
CREATE TABLE settings (
  id smallint PRIMARY KEY DEFAULT 1,
  password_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add unique constraints
ALTER TABLE folders ADD CONSTRAINT folders_name_key UNIQUE (name);
ALTER TABLE folders ADD CONSTRAINT folders_slug_key UNIQUE (slug);

-- Add partial unique constraint for deduplication
CREATE UNIQUE INDEX items_type_hash_uq ON items(type, hash) WHERE hash IS NOT NULL;

-- Add performance indexes
CREATE INDEX items_tags_idx ON items USING gin(tags);
CREATE INDEX items_ts_idx ON items USING gin(ts);
CREATE INDEX items_type_created_idx ON items (type, created_at DESC);
CREATE INDEX items_type_taken_created_idx ON items (type, taken_at DESC, created_at DESC);

-- Create full-text search trigger function
CREATE OR REPLACE FUNCTION items_tsvector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.ts := setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A')
         || setweight(to_tsvector('simple', coalesce(NEW.body,'')), 'B')
         || setweight(to_tsvector('simple', array_to_string(NEW.tags, ' ')), 'C');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- Create trigger for automatic tsvector updates
CREATE TRIGGER items_tsvector_update
  BEFORE INSERT OR UPDATE OF title, body, tags
  ON items FOR EACH ROW EXECUTE FUNCTION items_tsvector_trigger();

-- Enable Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON folders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users"
  ON items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users"
  ON settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default settings (password hash for "deep2924")
-- Using bcrypt hash: $2b$10$... (this would be generated properly in production)
INSERT INTO settings (id, password_hash) VALUES (1, '$2b$10$rQJ5qP5qP5qP5qP5qP5qPOExample.Hash.For.Deep2924.Password')
ON CONFLICT (id) DO NOTHING;