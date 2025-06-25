
-- Add freshness_days column to food_items table
ALTER TABLE public.food_items 
ADD COLUMN freshness_days INTEGER DEFAULT 4;
