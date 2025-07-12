-- Create saved_tags table for storing user's frequently used tags
CREATE TABLE public.saved_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_category TEXT NOT NULL DEFAULT 'general', -- 'general', 'food', 'recipe', 'meal'
  usage_count INTEGER DEFAULT 1,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, tag_name, tag_category)
);

-- Enable RLS on saved_tags
ALTER TABLE public.saved_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_tags
CREATE POLICY "Users can view their own saved tags" 
  ON public.saved_tags FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved tags" 
  ON public.saved_tags FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved tags" 
  ON public.saved_tags FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved tags" 
  ON public.saved_tags FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_saved_tags_user_id ON public.saved_tags(user_id);
CREATE INDEX idx_saved_tags_category ON public.saved_tags(tag_category);
CREATE INDEX idx_saved_tags_usage_count ON public.saved_tags(usage_count DESC);
CREATE INDEX idx_saved_tags_favorite ON public.saved_tags(is_favorite) WHERE is_favorite = true;

-- Add comments to document the table structure
COMMENT ON TABLE public.saved_tags IS 'User-saved tags for quick reuse across the application';
COMMENT ON COLUMN public.saved_tags.tag_category IS 'Category of the tag: general, food, recipe, meal';
COMMENT ON COLUMN public.saved_tags.usage_count IS 'Number of times this tag has been used (for sorting by popularity)';
COMMENT ON COLUMN public.saved_tags.is_favorite IS 'Whether this tag is marked as favorite by the user';