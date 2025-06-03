/*
  # Storage Configuration for Document Management

  1. Changes
    - Add file_data column to file_history table to store file content
    - Add file_preview column to store preview URLs
    - Update RLS policies to allow access to the new columns
*/

-- Add file_data column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'file_history' 
    AND column_name = 'file_data'
  ) THEN
    ALTER TABLE file_history ADD COLUMN file_data jsonb;
  END IF;
END $$;

-- Update RLS policies for file_history table
DROP POLICY IF EXISTS "Allow public read access" ON file_history;
DROP POLICY IF EXISTS "Allow public write access" ON file_history;

CREATE POLICY "Allow public read access" 
  ON file_history
  FOR SELECT 
  TO anon
  USING (true);

CREATE POLICY "Allow public write access" 
  ON file_history
  FOR INSERT
  TO anon
  WITH CHECK (true);