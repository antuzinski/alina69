/*
  # Create calendar_events table

  1. New Tables
    - `calendar_events`
      - `id` (uuid, primary key) - Unique identifier for the event
      - `title` (text, required) - Event title
      - `description` (text) - Optional event description
      - `start_date` (date, required) - Event start date (YYYY-MM-DD)
      - `end_date` (date, required) - Event end date (YYYY-MM-DD)
      - `color` (text, required) - Event color in hex format (#rrggbb)
      - `created_at` (timestamptz) - Timestamp when event was created
      - `updated_at` (timestamptz) - Timestamp when event was last updated

  2. Security
    - Enable RLS on `calendar_events` table
    - Add policy for anonymous users to read all events
    - Add policy for anonymous users to create events
    - Add policy for anonymous users to update events
    - Add policy for anonymous users to delete events

  3. Important Notes
    - Uses `date` type for start_date and end_date to avoid timezone issues
    - Default values ensure data integrity
    - Allows anonymous access for ease of use
*/

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view calendar events"
  ON calendar_events
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create calendar events"
  ON calendar_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update calendar events"
  ON calendar_events
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete calendar events"
  ON calendar_events
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_calendar_events_dates 
  ON calendar_events(start_date, end_date);
