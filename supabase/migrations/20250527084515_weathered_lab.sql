/*
  # Create documents storage bucket

  1. New Storage Bucket
    - Creates a new public storage bucket named 'documents'
    - Enables public access for authenticated users
  
  2. Security
    - Adds RLS policies for:
      - Authenticated users can read and write files
      - Public users can only read files
*/

-- Create the storage bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true);

-- Policy to allow authenticated users to upload files
create policy "Allow authenticated users to upload files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'documents');

-- Policy to allow authenticated users to update their files
create policy "Allow authenticated users to update files"
on storage.objects for update
to authenticated
using (bucket_id = 'documents');

-- Policy to allow public read access to files
create policy "Allow public read access to files"
on storage.objects for select
to public
using (bucket_id = 'documents');

-- Policy to allow authenticated users to delete their files
create policy "Allow authenticated users to delete files"
on storage.objects for delete
to authenticated
using (bucket_id = 'documents');