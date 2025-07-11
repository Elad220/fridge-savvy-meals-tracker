-- Add ingredients and preparation steps to meal_plans table
ALTER TABLE public.meal_plans 
ADD COLUMN ingredients JSONB DEFAULT '[]'::jsonb,
ADD COLUMN preparation_steps JSONB DEFAULT '[]'::jsonb;

-- Add comments to document the new columns
COMMENT ON COLUMN public.meal_plans.ingredients IS 'Array of ingredient objects with name, quantity, unit, and notes';
COMMENT ON COLUMN public.meal_plans.preparation_steps IS 'Array of preparation step strings';

-- Create indexes for better performance when querying ingredients
CREATE INDEX idx_meal_plans_ingredients ON public.meal_plans USING GIN (ingredients);
CREATE INDEX idx_meal_plans_preparation_steps ON public.meal_plans USING GIN (preparation_steps); 