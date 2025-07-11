-- Create recipes table for storing user-saved recipes
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of ingredient objects with name, quantity, unit
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of instruction strings
  prep_time TEXT,
  cook_time TEXT,
  servings TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  tags TEXT[], -- Array of tags for categorization
  source TEXT, -- 'manual', 'generated', 'imported'
  source_metadata JSONB, -- Store additional metadata about the source
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on recipes
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Create policies for recipes
CREATE POLICY "Users can view their own recipes" 
  ON public.recipes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes" 
  ON public.recipes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" 
  ON public.recipes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" 
  ON public.recipes FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX idx_recipes_name ON public.recipes(name);
CREATE INDEX idx_recipes_difficulty ON public.recipes(difficulty);
CREATE INDEX idx_recipes_tags ON public.recipes USING GIN (tags);
CREATE INDEX idx_recipes_favorite ON public.recipes(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_recipes_source ON public.recipes(source);

-- Add comments to document the table structure
COMMENT ON TABLE public.recipes IS 'User-saved recipes for future reference';
COMMENT ON COLUMN public.recipes.ingredients IS 'Array of ingredient objects with name, quantity, unit, and optional notes';
COMMENT ON COLUMN public.recipes.instructions IS 'Array of step-by-step instruction strings';
COMMENT ON COLUMN public.recipes.source IS 'Source of the recipe: manual (user created), generated (AI generated), imported (from external source)';
COMMENT ON COLUMN public.recipes.source_metadata IS 'Additional metadata about the source (e.g., AI provider, model, generation parameters)';
COMMENT ON COLUMN public.recipes.tags IS 'Array of tags for categorizing recipes (e.g., ["breakfast", "vegetarian", "quick"])'; 