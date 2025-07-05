-- Migration to update food_items table to use amount and unit instead of quantity
-- Add new columns
ALTER TABLE food_items 
ADD COLUMN amount DECIMAL(10,2) DEFAULT 1,
ADD COLUMN unit VARCHAR(50) DEFAULT 'item';

-- Update existing records to extract amount and unit from quantity where possible
-- This is a best-effort migration that handles common patterns
UPDATE food_items 
SET 
  amount = CASE 
    WHEN quantity ~ '^[0-9]+(\.[0-9]+)?$' THEN quantity::DECIMAL(10,2)
    WHEN quantity ~ '^[0-9]+(\.[0-9]+)?\s+' THEN SPLIT_PART(quantity, ' ', 1)::DECIMAL(10,2)
    ELSE 1
  END,
  unit = CASE 
    WHEN quantity ~ '^[0-9]+(\.[0-9]+)?\s+(.+)$' THEN TRIM(REGEXP_REPLACE(quantity, '^[0-9]+(\.[0-9]+)?\s+', ''))
    WHEN quantity ~ '^[0-9]+(\.[0-9]+)?$' THEN 'item'
    ELSE 'item'
  END
WHERE quantity IS NOT NULL;

-- Set default values for any NULL quantities
UPDATE food_items 
SET amount = 1, unit = 'item' 
WHERE quantity IS NULL;

-- Make the new columns NOT NULL
ALTER TABLE food_items 
ALTER COLUMN amount SET NOT NULL,
ALTER COLUMN unit SET NOT NULL;

-- Drop the old quantity column
ALTER TABLE food_items DROP COLUMN quantity;