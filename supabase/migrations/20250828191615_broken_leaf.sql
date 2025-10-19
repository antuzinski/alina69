/*
  # Initial Schema for Memory Catalog

  1. New Tables
    - `folders`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique)
      - `created_at` (timestamp)
    - `items`
      - `id` (uuid, primary key)
      - `type` (text, check constraint for text/image/quote)
      - `title` (text)
      - `body` (text)
      - `preview` (text, auto-generated for texts)
      - `image_url` (text, for images)
      - `folder_id` (uuid, foreign key)
      - `tags` (text array)
      - `people` (text array)
      - `taken_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_public` (boolean, always false)
      - `is_pinned` (boolean)
      - `hash` (text, for deduplication)
      - `ts` (tsvector, for full-text search)
    - `settings`
      - `id` (smallint, primary key)
      - `password_hash` (text)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Create indexes for performance
    - Add full-text search trigger
*/

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text CHECK (type IN ('text', 'image', 'quote')) NOT NULL,
  title text,
  body text,
  preview text,
  image_url text,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  people text[] DEFAULT '{}',
  taken_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  hash text,
  ts tsvector
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id smallint PRIMARY KEY DEFAULT 1,
  password_hash text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS items_tags_idx ON items USING gin(tags);
CREATE INDEX IF NOT EXISTS items_type_created_idx ON items (type, created_at DESC);
CREATE INDEX IF NOT EXISTS items_ts_idx ON items USING gin(ts);
CREATE UNIQUE INDEX IF NOT EXISTS items_type_hash_uq ON items(type, hash) WHERE hash IS NOT NULL;

-- Full-text search trigger function
CREATE OR REPLACE FUNCTION items_tsvector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.ts := setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A')
         || setweight(to_tsvector('simple', coalesce(NEW.body,'')), 'B')
         || setweight(to_tsvector('simple', array_to_string(NEW.tags, ' ')), 'C');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS items_tsvector_update ON items;
CREATE TRIGGER items_tsvector_update
  BEFORE INSERT OR UPDATE OF title, body, tags
  ON items FOR EACH ROW EXECUTE FUNCTION items_tsvector_trigger();

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for authenticated users since it's single-user app)
CREATE POLICY "Allow all operations for authenticated users" ON folders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default folders
INSERT INTO folders (name, slug) VALUES 
  ('Общие', 'general'),
  ('Избранное', 'favorites')
ON CONFLICT (name) DO NOTHING;

-- Insert default password hash (for "deep2924")
INSERT INTO settings (password_hash) VALUES 
  ('$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (id) DO NOTHING;