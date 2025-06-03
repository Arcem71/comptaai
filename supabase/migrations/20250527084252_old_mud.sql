/*
  # Add file storage support

  1. Changes
    - Add 'file_data' column to file_history table
      - Type: jsonb
      - Nullable: true
      - Purpose: Store file metadata including Supabase storage paths
*/

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