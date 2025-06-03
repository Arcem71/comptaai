/*
  # Storage Bucket Policies

  1. Changes
    - Create storage bucket for documents
    - Set up public access policies for the storage bucket
    - Configure access policies for documents

  2. Security
    - Enable policies for read, insert, update, and delete operations
    - Restrict operations to the 'documents' bucket
*/

-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public insert access" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public update access" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public delete access" ON storage.objects;
END $$;

-- Create new policies
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

CREATE POLICY "Allow public insert access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public update access"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public delete access"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'documents');