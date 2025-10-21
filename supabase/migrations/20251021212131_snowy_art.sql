/*
  # Wavelength Game Tables

  1. New Tables
    - `wl_game` - Singleton game state table
      - `id` (text, primary key, default 'default')
      - `phase` (text, game phase enum)
      - `current_round_index` (integer, current round number)
      - `active_clue_giver` (text, 'A' or 'B')
      - `updated_at` (timestamp)
    
    - `wl_cards` - Game cards with left/right labels
      - `id` (uuid, primary key)
      - `left_label` (text, left side of spectrum)
      - `right_label` (text, right side of spectrum)
      - `created_at` (timestamp)
    
    - `wl_rounds` - Game rounds history
      - `id` (uuid, primary key)
      - `game_id` (text, references wl_game)
      - `round_index` (integer, round number)
      - `card_id` (uuid, references wl_cards)
      - `target` (integer, target position 0-100)
      - `clue` (text, clue given by clue giver)
      - `guess` (integer, guess position 0-100)
      - `delta` (integer, absolute difference)
      - `score` (integer, calculated score)
      - `clue_giver_role` (text, 'A' or 'B')
      - `guesser_role` (text, 'A' or 'B')
      - `is_best_shot` (boolean, is this a best shot)
      - `created_at` (timestamp)
      - `revealed_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write all data
    - For MVP, simple policies - can be tightened later

  3. Initial Data
    - Insert singleton game record
    - Seed ~20 starter cards
*/

-- Create enum types
CREATE TYPE wl_phase AS ENUM ('ROUND_PREP', 'CLUE_PHASE', 'GUESS_PHASE', 'REVEAL');
CREATE TYPE wl_player_role AS ENUM ('A', 'B');

-- Game state table (singleton)
CREATE TABLE IF NOT EXISTS wl_game (
  id text PRIMARY KEY DEFAULT 'default',
  phase wl_phase NOT NULL DEFAULT 'ROUND_PREP',
  current_round_index integer NOT NULL DEFAULT 0,
  active_clue_giver wl_player_role NOT NULL DEFAULT 'A',
  updated_at timestamptz DEFAULT now()
);

-- Cards table
CREATE TABLE IF NOT EXISTS wl_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  left_label text NOT NULL,
  right_label text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Rounds table
CREATE TABLE IF NOT EXISTS wl_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text NOT NULL REFERENCES wl_game(id) ON DELETE CASCADE,
  round_index integer NOT NULL,
  card_id uuid NOT NULL REFERENCES wl_cards(id),
  target integer NOT NULL CHECK (target >= 0 AND target <= 100),
  clue text,
  guess integer CHECK (guess >= 0 AND guess <= 100),
  delta integer CHECK (delta >= 0 AND delta <= 100),
  score integer CHECK (score >= 0 AND score <= 100),
  clue_giver_role wl_player_role NOT NULL,
  guesser_role wl_player_role NOT NULL,
  is_best_shot boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  revealed_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS wl_rounds_game_id_idx ON wl_rounds(game_id);
CREATE INDEX IF NOT EXISTS wl_rounds_round_index_idx ON wl_rounds(round_index);
CREATE INDEX IF NOT EXISTS wl_rounds_is_best_shot_idx ON wl_rounds(is_best_shot) WHERE is_best_shot = true;

-- Enable RLS
ALTER TABLE wl_game ENABLE ROW LEVEL SECURITY;
ALTER TABLE wl_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE wl_rounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies (MVP - allow all for authenticated users)
CREATE POLICY "Allow all operations for authenticated users on wl_game"
  ON wl_game
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on wl_cards"
  ON wl_cards
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users on wl_rounds"
  ON wl_rounds
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert singleton game record
INSERT INTO wl_game (id, phase, current_round_index, active_clue_giver)
VALUES ('default', 'ROUND_PREP', 0, 'A')
ON CONFLICT (id) DO NOTHING;

-- Seed starter cards
INSERT INTO wl_cards (left_label, right_label) VALUES
  ('Hot', 'Cold'),
  ('Fast', 'Slow'),
  ('Big', 'Small'),
  ('Light', 'Dark'),
  ('Loud', 'Quiet'),
  ('Hard', 'Soft'),
  ('Sweet', 'Bitter'),
  ('New', 'Old'),
  ('Cheap', 'Expensive'),
  ('Simple', 'Complex'),
  ('Happy', 'Sad'),
  ('Clean', 'Dirty'),
  ('Smooth', 'Rough'),
  ('Wet', 'Dry'),
  ('Heavy', 'Light'),
  ('Sharp', 'Dull'),
  ('Bright', 'Dim'),
  ('Thick', 'Thin'),
  ('Wide', 'Narrow'),
  ('High', 'Low')
ON CONFLICT DO NOTHING;