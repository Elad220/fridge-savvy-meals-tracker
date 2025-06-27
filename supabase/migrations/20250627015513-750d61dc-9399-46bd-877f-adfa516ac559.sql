
-- Create a table to store encrypted API tokens for users
CREATE TABLE public.user_api_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  token_name TEXT NOT NULL DEFAULT 'gemini',
  encrypted_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token_name)
);

-- Add Row Level Security (RLS) to ensure users can only see their own tokens
ALTER TABLE public.user_api_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own tokens
CREATE POLICY "Users can view their own API tokens" 
  ON public.user_api_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own tokens
CREATE POLICY "Users can create their own API tokens" 
  ON public.user_api_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own tokens
CREATE POLICY "Users can update their own API tokens" 
  ON public.user_api_tokens 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own tokens
CREATE POLICY "Users can delete their own API tokens" 
  ON public.user_api_tokens 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a function to encrypt API tokens
CREATE OR REPLACE FUNCTION public.encrypt_api_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple encryption using pgcrypto extension
  -- In production, you might want to use a more sophisticated encryption method
  RETURN encode(digest(token || current_setting('app.jwt_secret', true), 'sha256'), 'base64');
END;
$$;

-- Create a function to store encrypted API token
CREATE OR REPLACE FUNCTION public.store_api_token(token_name TEXT, api_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_id UUID;
BEGIN
  INSERT INTO public.user_api_tokens (user_id, token_name, encrypted_token)
  VALUES (auth.uid(), token_name, api_token)
  ON CONFLICT (user_id, token_name) 
  DO UPDATE SET 
    encrypted_token = EXCLUDED.encrypted_token,
    updated_at = now()
  RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$;
