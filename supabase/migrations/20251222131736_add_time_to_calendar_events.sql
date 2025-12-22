/*
  # Add time fields to calendar_events table

  1. Changes
    - Add `start_time` (time) - Optional start time for the event (HH:MM:SS)
    - Add `end_time` (time) - Optional end time for the event (HH:MM:SS)

  2. Notes
    - Time fields are optional to support all-day events
    - Uses PostgreSQL `time` type for time-only values
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN start_time time;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN end_time time;
  END IF;
END $$;
