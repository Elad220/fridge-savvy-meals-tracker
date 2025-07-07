-- Add missing AI recommendations tables if they don't exist
-- This migration ensures all required tables are present

-- Create table for AI recommendations cache if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL, -- 'shopping', 'meal', 'low_stock', 'ai_powered'
  recommendations JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 day')
);

-- Create table for consumption patterns if it doesn't exist
CREATE TABLE IF NOT EXISTS public.consumption_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  average_consumption_rate DECIMAL(10,2), -- items per week
  last_purchase_date DATE,
  typical_quantity INTEGER,
  typical_unit TEXT,
  times_purchased INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for meal combinations if it doesn't exist
CREATE TABLE IF NOT EXISTS public.meal_combinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  ingredients JSONB NOT NULL, -- Array of ingredient names
  frequency INTEGER DEFAULT 1,
  last_prepared DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for user preferences if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  favorite_items JSONB DEFAULT '[]'::jsonb,
  dietary_restrictions TEXT[],
  preferred_meal_types TEXT[],
  shopping_frequency TEXT DEFAULT 'weekly',
  typical_household_size INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can insert their own recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can delete their own recommendations" ON public.ai_recommendations;

DROP POLICY IF EXISTS "Users can view their own consumption patterns" ON public.consumption_patterns;
DROP POLICY IF EXISTS "Users can insert their own consumption patterns" ON public.consumption_patterns;
DROP POLICY IF EXISTS "Users can update their own consumption patterns" ON public.consumption_patterns;

DROP POLICY IF EXISTS "Users can manage their own meal combinations" ON public.meal_combinations;

DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;

-- Create policies for ai_recommendations
CREATE POLICY "Users can view their own recommendations" 
  ON public.ai_recommendations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations" 
  ON public.ai_recommendations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations" 
  ON public.ai_recommendations FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for consumption_patterns
CREATE POLICY "Users can view their own consumption patterns" 
  ON public.consumption_patterns FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consumption patterns" 
  ON public.consumption_patterns FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consumption patterns" 
  ON public.consumption_patterns FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for meal_combinations
CREATE POLICY "Users can manage their own meal combinations" 
  ON public.meal_combinations FOR ALL 
  USING (auth.uid() = user_id);

-- Create policies for user_preferences
CREATE POLICY "Users can view their own preferences" 
  ON public.user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
  ON public.user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON public.user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_consumption_patterns_user_item ON public.consumption_patterns(user_id, item_name);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_type ON public.ai_recommendations(user_id, recommendation_type);
CREATE INDEX IF NOT EXISTS idx_meal_combinations_user ON public.meal_combinations(user_id);

-- Create function to update consumption patterns
CREATE OR REPLACE FUNCTION public.update_consumption_pattern(
  p_user_id UUID,
  p_item_name TEXT,
  p_quantity INTEGER,
  p_unit TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.consumption_patterns (
    user_id, 
    item_name, 
    typical_quantity, 
    typical_unit, 
    last_purchase_date,
    times_purchased
  )
  VALUES (
    p_user_id, 
    p_item_name, 
    p_quantity, 
    p_unit, 
    CURRENT_DATE,
    1
  )
  ON CONFLICT (user_id, item_name) 
  DO UPDATE SET
    typical_quantity = (consumption_patterns.typical_quantity * consumption_patterns.times_purchased + EXCLUDED.typical_quantity) / (consumption_patterns.times_purchased + 1),
    typical_unit = EXCLUDED.typical_unit,
    last_purchase_date = EXCLUDED.last_purchase_date,
    times_purchased = consumption_patterns.times_purchased + 1,
    updated_at = now();
END;
$$; 