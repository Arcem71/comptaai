/*
  # Configure storage bucket and policies

  1. Changes
    - Create public documents bucket
    - Set up simple public access policies
    - Enable unrestricted access for testing
*/

-- Create or update the documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Remove any existing policies
DROP POLICY IF EXISTS "Public access" ON storage.objects;

-- Create a single policy for all operations
CREATE POLICY "Public access"
ON storage.objects
FOR ALL
TO public
USING (true)
WITH CHECK (true);