-- Add tags column to food_items table for categorization
ALTER TABLE food_items 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for better performance when querying by tags
CREATE INDEX idx_food_items_tags ON food_items USING GIN (tags);

-- Add comment to document the new column
COMMENT ON COLUMN food_items.tags IS 'Array of tags for categorizing food items (e.g., ["organic", "frozen", "pantry"])'; 