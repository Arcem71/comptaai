/*
  # File History Schema

  1. New Tables
    - `file_history`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with time zone, default: now())
      - `files` (json - stores file names and metadata)
      - `status` (text - success, error, etc.)
  2. Security
    - Enable RLS on `file_history` table
    - Add policy for public access to file history data
*/

-- Create file_history table
CREATE TABLE IF NOT EXISTS file_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  files jsonb NOT NULL,
  status text NOT NULL
);

-- Enable row level security
ALTER TABLE file_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public reads
CREATE POLICY "Allow public read access" 
  ON file_history
  FOR SELECT 
  TO anon
  USING (true);

-- Create policy to allow public writes
CREATE POLICY "Allow public write access" 
  ON file_history
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create function to automatically delete records older than 7 days
CREATE OR REPLACE FUNCTION delete_old_file_history()
RETURNS trigger AS $$
BEGIN
  DELETE FROM file_history
  WHERE created_at < NOW() - INTERVAL '7 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run the function after each insert
CREATE OR REPLACE TRIGGER trigger_delete_old_file_history
AFTER INSERT ON file_history
EXECUTE FUNCTION delete_old_file_history();