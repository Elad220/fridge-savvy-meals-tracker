
-- Update the store_api_token function to properly encrypt tokens
CREATE OR REPLACE FUNCTION public.store_api_token(p_token_name text, p_api_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_id UUID;
  encrypted_token TEXT;
BEGIN
  -- Encrypt the token before storing
  encrypted_token := public.encrypt_api_token(p_api_token);
  
  INSERT INTO public.user_api_tokens (user_id, token_name, encrypted_token)
  VALUES (auth.uid(), p_token_name, encrypted_token)
  ON CONFLICT (user_id, token_name) 
  DO UPDATE SET 
    encrypted_token = EXCLUDED.encrypted_token,
    updated_at = now()
  RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$;
