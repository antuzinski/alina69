/*
  # Allow Anonymous Access to All Tables

  1. Changes
    - Drop existing authenticated-only policies on items, folders, and settings
    - Create new policies that allow anonymous (anon) and authenticated users full access
    
  2. Security
    - All tables are now accessible without authentication
    - This is appropriate for a personal app that doesn't require user accounts
    - RLS is still enabled to maintain the security framework
*/

-- Drop existing authenticated-only policies for items
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON items;

-- items policies
CREATE POLICY "Allow all users to read items"
  ON items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all users to insert items"
  ON items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all users to update items"
  ON items
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete items"
  ON items
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Drop existing authenticated-only policies for folders
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON folders;

-- folders policies
CREATE POLICY "Allow all users to read folders"
  ON folders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all users to insert folders"
  ON folders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all users to update folders"
  ON folders
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete folders"
  ON folders
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Drop existing authenticated-only policies for settings
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON settings;

-- settings policies
CREATE POLICY "Allow all users to read settings"
  ON settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all users to insert settings"
  ON settings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all users to update settings"
  ON settings
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete settings"
  ON settings
  FOR DELETE
  TO anon, authenticated
  USING (true);