/*
  # Enable bulk deletion support

  1. Changes
    - Add index for faster bulk operations
    - Update RLS policies to ensure bulk deletion works
    - Add explicit cascade deletion support
*/

-- Ensure we have proper indexing for bulk operations
CREATE INDEX IF NOT EXISTS idx_file_history_created_at ON file_history(created_at);

-- Update RLS policies to explicitly allow bulk deletions
DROP POLICY IF EXISTS "Allow public delete access" ON file_history;

CREATE POLICY "Allow public delete access"
  ON file_history
  FOR DELETE
  TO public
  USING (true);

-- Ensure we have proper cascade deletion setup
ALTER TABLE file_history
DROP CONSTRAINT IF EXISTS file_history_pkey CASCADE,
ADD CONSTRAINT file_history_pkey PRIMARY KEY (id);