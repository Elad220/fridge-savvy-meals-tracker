-- Create storage_locations table for user-specific storage locations
CREATE TABLE public.storage_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, location_name)
);

-- Enable RLS
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;

-- Policies for user access
CREATE POLICY "Users can view their own storage locations"
  ON public.storage_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own storage locations"
  ON public.storage_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own storage locations"
  ON public.storage_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own storage locations"
  ON public.storage_locations FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_storage_locations_user_id ON public.storage_locations(user_id); 