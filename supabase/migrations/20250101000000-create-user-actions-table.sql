-- Create user_actions table to track user add/remove actions
CREATE TABLE public.user_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('add', 'remove', 'update', 'move')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('food_item', 'meal_plan')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  -- Store the full entity data as JSON for detailed tracking
  entity_data JSONB,
  -- Store additional context about the action
  action_context JSONB,
  -- Timestamp of the action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create indexes for better query performance
CREATE INDEX idx_user_actions_user_id ON public.user_actions(user_id);
CREATE INDEX idx_user_actions_action_type ON public.user_actions(action_type);
CREATE INDEX idx_user_actions_entity_type ON public.user_actions(entity_type);
CREATE INDEX idx_user_actions_created_at ON public.user_actions(created_at);
CREATE INDEX idx_user_actions_entity_id ON public.user_actions(entity_id);

-- Enable RLS on user_actions
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_actions
CREATE POLICY "Users can view their own actions" 
  ON public.user_actions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own actions" 
  ON public.user_actions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create a function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action(
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_name TEXT,
  p_entity_data JSONB DEFAULT NULL,
  p_action_context JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO public.user_actions (
    user_id, 
    action_type, 
    entity_type, 
    entity_id, 
    entity_name, 
    entity_data, 
    action_context
  )
  VALUES (
    auth.uid(), 
    p_action_type, 
    p_entity_type, 
    p_entity_id, 
    p_entity_name, 
    p_entity_data, 
    p_action_context
  )
  RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$;

-- Create a function to get user action statistics
CREATE OR REPLACE FUNCTION public.get_user_action_stats(
  p_user_id UUID DEFAULT auth.uid(),
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  action_type TEXT,
  entity_type TEXT,
  action_count BIGINT,
  most_recent_action TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.action_type,
    ua.entity_type,
    COUNT(*) as action_count,
    MAX(ua.created_at) as most_recent_action
  FROM public.user_actions ua
  WHERE ua.user_id = p_user_id
    AND ua.created_at >= (now() - (p_days_back || ' days')::interval)
  GROUP BY ua.action_type, ua.entity_type
  ORDER BY action_count DESC;
END;
$$;

-- Create a function to get recent user actions
CREATE OR REPLACE FUNCTION public.get_recent_user_actions(
  p_user_id UUID DEFAULT auth.uid(),
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  action_type TEXT,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  entity_data JSONB,
  action_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.action_type,
    ua.entity_type,
    ua.entity_id,
    ua.entity_name,
    ua.entity_data,
    ua.action_context,
    ua.created_at
  FROM public.user_actions ua
  WHERE ua.user_id = p_user_id
  ORDER BY ua.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Create a function to get action patterns for predictions
CREATE OR REPLACE FUNCTION public.get_user_action_patterns(
  p_user_id UUID DEFAULT auth.uid(),
  p_days_back INTEGER DEFAULT 90
)
RETURNS TABLE (
  entity_name TEXT,
  action_type TEXT,
  action_count BIGINT,
  avg_days_between_actions NUMERIC,
  most_common_storage_location TEXT,
  most_common_label TEXT,
  avg_freshness_days NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.entity_name,
    ua.action_type,
    COUNT(*) as action_count,
    CASE 
      WHEN COUNT(*) > 1 THEN 
        EXTRACT(EPOCH FROM (MAX(ua.created_at) - MIN(ua.created_at))) / 86400.0 / (COUNT(*) - 1)
      ELSE NULL
    END as avg_days_between_actions,
    MODE() WITHIN GROUP (ORDER BY ua.entity_data->>'storage_location') as most_common_storage_location,
    MODE() WITHIN GROUP (ORDER BY ua.entity_data->>'label') as most_common_label,
    AVG((ua.entity_data->>'freshness_days')::numeric) as avg_freshness_days
  FROM public.user_actions ua
  WHERE ua.user_id = p_user_id
    AND ua.created_at >= (now() - (p_days_back || ' days')::interval)
    AND ua.entity_type = 'food_item'
  GROUP BY ua.entity_name, ua.action_type
  HAVING COUNT(*) >= 2
  ORDER BY action_count DESC;
END;
$$;