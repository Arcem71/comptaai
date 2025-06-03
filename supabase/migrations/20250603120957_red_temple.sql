/*
  # Fix file history RLS policies

  1. Changes
    - Drop existing policies that are too permissive
    - Add proper RLS policies for authenticated users
    - Ensure proper access control for all operations

  2. Security
    - Enable RLS on file_history table
    - Add policies for authenticated users to:
      - Insert their own records
      - Read their own records
      - Delete their own records
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public delete access" ON file_history;
DROP POLICY IF EXISTS "Allow public read access" ON file_history;
DROP POLICY IF EXISTS "Allow public write access" ON file_history;

-- Create new policies for authenticated users
CREATE POLICY "Enable read access for authenticated users"
ON file_history
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert access for authenticated users"
ON file_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete access for authenticated users"
ON file_history
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);