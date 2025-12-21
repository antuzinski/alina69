/*
  # Configure Replica Identity for Tasks Table

  1. Changes
    - Set REPLICA IDENTITY to FULL for the tasks table
    - This ensures that Realtime events include both old and new row data
    - Required for proper UPDATE event handling in Realtime subscriptions

  2. Why This Is Important
    - By default, PostgreSQL only sends the primary key in UPDATE events
    - FULL replica identity sends complete row data (old and new)
    - This allows our application to compare old vs new values
    - Critical for detecting completion status changes in tasks
*/

-- Set replica identity to FULL to include all columns in realtime events
ALTER TABLE tasks REPLICA IDENTITY FULL;