/*
  # Allow Anonymous Access to Tasks Table

  1. Changes
    - Drop existing authenticated-only policies on tasks table
    - Create new policies that allow anonymous (anon) and authenticated users full access
    - Update user_id column to be nullable since anonymous users don't have a user_id
    
  2. Security
    - Tasks table is now accessible without authentication
    - This is consistent with other tables in the app (items, folders, settings)
    - RLS is still enabled to maintain the security framework
*/

-- Make user_id nullable for anonymous users
ALTER TABLE tasks ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Create new policies that allow both anonymous and authenticated users
CREATE POLICY "Allow all users to read tasks"
  ON tasks
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all users to insert tasks"
  ON tasks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all users to update tasks"
  ON tasks
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all users to delete tasks"
  ON tasks
  FOR DELETE
  TO anon, authenticated
  USING (true);