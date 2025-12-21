/*
  # Enable Realtime for Tasks Table

  1. Changes
    - Enable Realtime replication for the `tasks` table
    - This allows real-time synchronization of task changes across multiple devices
    - Users will see task updates instantly without needing to refresh the page

  2. Important Notes
    - Realtime subscriptions require proper RLS policies (already configured)
    - Changes will broadcast only to users who have SELECT permission on the rows
    - This enables seamless multi-device collaboration
*/

-- Enable Realtime replication for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;