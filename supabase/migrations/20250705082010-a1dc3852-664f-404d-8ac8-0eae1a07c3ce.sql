-- Create action_history table to track add/remove actions
CREATE TABLE public.action_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'add' or 'remove'
  item_name TEXT NOT NULL,
  item_details JSONB, -- Store additional item information
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.action_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own action history" 
ON public.action_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action history" 
ON public.action_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance when querying recent actions
CREATE INDEX idx_action_history_user_created ON public.action_history(user_id, created_at DESC);