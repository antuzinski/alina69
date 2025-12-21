-- Fix RLS Policies for Anonymous Access
-- Run this in your Supabase SQL Editor if the migration doesn't work

-- ======================
-- ITEMS TABLE
-- ======================
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON items;

CREATE POLICY "Allow all users to read items"
  ON items FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow all users to insert items"
  ON items FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to update items"
  ON items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all users to delete items"
  ON items FOR DELETE TO anon, authenticated USING (true);

-- ======================
-- FOLDERS TABLE
-- ======================
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON folders;

CREATE POLICY "Allow all users to read folders"
  ON folders FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow all users to insert folders"
  ON folders FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to update folders"
  ON folders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all users to delete folders"
  ON folders FOR DELETE TO anon, authenticated USING (true);

-- ======================
-- SETTINGS TABLE
-- ======================
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON settings;

CREATE POLICY "Allow all users to read settings"
  ON settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow all users to insert settings"
  ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to update settings"
  ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all users to delete settings"
  ON settings FOR DELETE TO anon, authenticated USING (true);

-- ======================
-- WAVELENGTH TABLES
-- ======================
DROP POLICY IF EXISTS "Allow all operations for authenticated users on wl_cards" ON wl_cards;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on wl_game" ON wl_game;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on wl_rounds" ON wl_rounds;

-- wl_cards
CREATE POLICY "Allow all users to read wl_cards"
  ON wl_cards FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow all users to insert wl_cards"
  ON wl_cards FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to update wl_cards"
  ON wl_cards FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all users to delete wl_cards"
  ON wl_cards FOR DELETE TO anon, authenticated USING (true);

-- wl_game
CREATE POLICY "Allow all users to read wl_game"
  ON wl_game FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow all users to insert wl_game"
  ON wl_game FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to update wl_game"
  ON wl_game FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all users to delete wl_game"
  ON wl_game FOR DELETE TO anon, authenticated USING (true);

-- wl_rounds
CREATE POLICY "Allow all users to read wl_rounds"
  ON wl_rounds FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow all users to insert wl_rounds"
  ON wl_rounds FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow all users to update wl_rounds"
  ON wl_rounds FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all users to delete wl_rounds"
  ON wl_rounds FOR DELETE TO anon, authenticated USING (true);
