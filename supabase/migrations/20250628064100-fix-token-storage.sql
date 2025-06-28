
-- Fix the token storage to use plain text instead of hashing
-- since we can't decrypt a hash and RLS already protects access

-- Update the store_api_token function to store plain text tokens
CREATE OR REPLACE FUNCTION public.store_api_token(p_token_name text, p_api_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_id UUID;
BEGIN
  -- Store the token as plain text since RLS already protects access
  INSERT INTO public.user_api_tokens (user_id, token_name, encrypted_token)
  VALUES (auth.uid(), p_token_name, p_api_token)
  ON CONFLICT (user_id, token_name) 
  DO UPDATE SET 
    encrypted_token = EXCLUDED.encrypted_token,
    updated_at = now()
  RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$;

-- We can remove the encrypt_api_token function since we're not using it anymore
DROP FUNCTION IF EXISTS public.encrypt_api_token(text);
