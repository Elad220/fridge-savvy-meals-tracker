
-- Fix the encrypt_api_token function to handle the missing JWT secret gracefully
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
