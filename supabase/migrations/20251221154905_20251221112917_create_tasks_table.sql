/*
  # Create Tasks Table for Home Page Task Manager

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key) - Unique task identifier
      - `title` (text) - Task title
      - `description` (text, nullable) - Task description
      - `color` (text, nullable) - Color coding (hex color or predefined name)
      - `column_name` (text) - Column the task belongs to (Общее, Алина, Юра)
      - `position` (integer) - Position in the column for ordering
      - `parent_task_id` (uuid, nullable, foreign key) - Reference to parent task for nested tasks
      - `completed_at` (timestamptz, nullable) - When task was completed
      - `archived_at` (timestamptz, nullable) - When task was archived (hidden)
      - `user_id` (uuid, foreign key) - Reference to auth.users
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `tasks` table
    - Add policy for authenticated users to read their own tasks
    - Add policy for authenticated users to create their own tasks
    - Add policy for authenticated users to update their own tasks
    - Add policy for authenticated users to delete their own tasks

  3. Indexes
    - Add index on `user_id` for fast user queries
    - Add index on `column_name` for filtering by column
    - Add index on `parent_task_id` for nested task queries
    - Add index on `position` for ordering
    - Add index on `archived_at` for filtering out archived tasks
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT NULL,
  column_name text NOT NULL CHECK (column_name IN ('Общее', 'Алина', 'Юра')),
  position integer NOT NULL DEFAULT 0,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT NULL,
  archived_at timestamptz DEFAULT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_column_name_idx ON tasks(column_name);
CREATE INDEX IF NOT EXISTS tasks_parent_task_id_idx ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS tasks_position_idx ON tasks(position);
CREATE INDEX IF NOT EXISTS tasks_archived_at_idx ON tasks(archived_at);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS tasks_updated_at_trigger ON tasks;
CREATE TRIGGER tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();