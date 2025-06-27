
-- Fix the ambiguous column reference in the store_api_token function
CREATE OR REPLACE FUNCTION public.store_api_token(token_name TEXT, api_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_id UUID;
BEGIN
  INSERT INTO public.user_api_tokens (user_id, token_name, encrypted_token)
  VALUES (auth.uid(), store_api_token.token_name, store_api_token.api_token)
  ON CONFLICT (user_id, token_name) 
  DO UPDATE SET 
    encrypted_token = EXCLUDED.encrypted_token,
    updated_at = now()
  RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$;
