/*
  # Add message column to file_history table

  1. Changes
    - Add optional 'message' column to file_history table
      - Type: text
      - Nullable: true
      - Purpose: Store additional information about file operations
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'file_history' 
    AND column_name = 'message'
  ) THEN
    ALTER TABLE file_history ADD COLUMN message text;
  END IF;
END $$;