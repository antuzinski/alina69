/*
  # Allow Anonymous Access to Wavelength Game Tables

  1. Changes
    - Drop existing authenticated-only policies on wl_cards, wl_game, and wl_rounds
    - Create new policies that allow anonymous (anon) and authenticated users full access
    
  2. Security
    - Game tables (wl_cards, wl_game, wl_rounds) are now accessible without authentication
    - This is appropriate for a public game that doesn't require user accounts
    - RLS is still enabled to maintain the security framework
*/

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users on wl_cards" ON wl_cards;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on wl_game" ON wl_game;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on wl_rounds" ON wl_rounds;

-- Create new policies that allow both anonymous and authenticated users

-- wl_cards policies
CREATE POLICY "Allow all users to read wl_cards"
  ON wl_cards
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all users to insert wl_cards"
  ON wl_cards
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all users to update wl_cards"
  ON wl_cards
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete wl_cards"
  ON wl_cards
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- wl_game policies
CREATE POLICY "Allow all users to read wl_game"
  ON wl_game
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all users to insert wl_game"
  ON wl_game
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all users to update wl_game"
  ON wl_game
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete wl_game"
  ON wl_game
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- wl_rounds policies
CREATE POLICY "Allow all users to read wl_rounds"
  ON wl_rounds
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all users to insert wl_rounds"
  ON wl_rounds
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all users to update wl_rounds"
  ON wl_rounds
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete wl_rounds"
  ON wl_rounds
  FOR DELETE
  TO anon, authenticated
  USING (true);