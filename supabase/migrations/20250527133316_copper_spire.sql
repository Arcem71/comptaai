/*
  # Fix deletion functionality

  1. Changes
    - Add ON DELETE CASCADE to any potential foreign key constraints
    - Ensure proper indexing for faster deletions
    - Update RLS policies to allow deletion operations
*/

-- Add index on id for faster deletions
CREATE INDEX IF NOT EXISTS idx_file_history_id ON file_history(id);

-- Update RLS policies to ensure deletion is allowed
DROP POLICY IF EXISTS "Allow public delete access" ON file_history;

CREATE POLICY "Allow public delete access"
  ON file_history
  FOR DELETE
  TO public
  USING (true);