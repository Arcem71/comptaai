/*
  # Storage Access Policies

  1. Security
    - Add policies to allow public access to storage
    - Enable file uploads, downloads, and management
*/

-- Create policy to allow public read access to storage
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (true);

-- Create policy to allow public file uploads
CREATE POLICY "Allow public insert access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow public file updates
CREATE POLICY "Allow public update access"
ON storage.objects FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Create policy to allow public file deletions
CREATE POLICY "Allow public delete access"
ON storage.objects FOR DELETE
TO public
USING (true);