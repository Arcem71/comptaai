/*
  # Add document type support

  1. Changes
    - Add 'document_type' column to file_history table
      - Type: text
      - Nullable: true
      - Purpose: Store the type of document (e.g., 'achat')
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'file_history' 
    AND column_name = 'document_type'
  ) THEN
    ALTER TABLE file_history ADD COLUMN document_type text;
  END IF;
END $$;