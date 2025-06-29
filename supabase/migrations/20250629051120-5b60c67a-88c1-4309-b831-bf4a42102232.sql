
-- Update the encrypt_api_token function to properly encrypt tokens
CREATE OR REPLACE FUNCTION public.encrypt_api_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_key TEXT;
BEGIN
  -- Try to get the JWT secret, fallback to a default if not available
  BEGIN
    secret_key := current_setting('app.jwt_secret', true);
  EXCEPTION WHEN OTHERS THEN
    secret_key := 'fallback_secret_key_for_encryption';
  END;
  
  -- If secret_key is still null or empty, use a fallback
  IF secret_key IS NULL OR secret_key = '' THEN
    secret_key := 'fallback_secret_key_for_encryption';
  END IF;
  
  -- Return the encrypted token using pgcrypto's digest function
  RETURN encode(digest(token || secret_key, 'sha256'), 'base64');
END;
$$;

-- Create a function to decrypt API tokens (this is a simplified approach)
-- Note: SHA256 is one-way, so we'll use a different approach with symmetric encryption
DROP FUNCTION IF EXISTS public.encrypt_api_token(text);

-- Use pgcrypto extension for proper encryption/decryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt API tokens using symmetric encryption
CREATE OR REPLACE FUNCTION public.encrypt_api_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_key TEXT;
BEGIN
  -- Get or set a secret key for encryption
  secret_key := coalesce(current_setting('app.jwt_secret', true), 'default_encryption_key_change_in_production');
  
  -- Use pgp_sym_encrypt for symmetric encryption
  RETURN encode(pgp_sym_encrypt(token, secret_key), 'base64');
END;
$$;

-- Create a function to decrypt API tokens
CREATE OR REPLACE FUNCTION public.decrypt_api_token(encrypted_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_key TEXT;
BEGIN
  -- Get the same secret key used for encryption
  secret_key := coalesce(current_setting('app.jwt_secret', true), 'default_encryption_key_change_in_production');
  
  -- Use pgp_sym_decrypt for symmetric decryption
  RETURN pgp_sym_decrypt(decode(encrypted_token, 'base64'), secret_key);
END;
$$;

-- Update the store_api_token function to use proper encryption
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

-- Create a function to retrieve and decrypt API tokens
CREATE OR REPLACE FUNCTION public.get_decrypted_api_token(p_token_name text)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encrypted_token TEXT;
BEGIN
  -- Get the encrypted token for the current user
  SELECT user_api_tokens.encrypted_token INTO encrypted_token
  FROM public.user_api_tokens
  WHERE user_id = auth.uid() AND token_name = p_token_name;
  
  -- Return null if no token found
  IF encrypted_token IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Decrypt and return the token
  RETURN public.decrypt_api_token(encrypted_token);
END;
$$;
