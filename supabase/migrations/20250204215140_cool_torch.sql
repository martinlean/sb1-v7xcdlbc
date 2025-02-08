/*
  # Create base functions

  1. Functions
    - `update_updated_at_column()`
      - Trigger function to automatically update updated_at timestamp
      - Used by multiple tables to maintain last update time

  2. Purpose
    - Provides core functionality needed by other tables
    - Must be created before tables that use these functions
*/

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add helpful comment
COMMENT ON FUNCTION update_updated_at_column() IS 
'Trigger function to automatically update updated_at timestamp when a row is updated';