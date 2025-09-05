-- Update the decrypt function to handle type casting properly
CREATE OR REPLACE FUNCTION public.decrypt_api_token(encrypted_token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  secret_key TEXT;
  decoded_data bytea;
BEGIN
  -- Get the same secret key used for encryption
  secret_key := coalesce(current_setting('app.jwt_secret', true), 'default_encryption_key_change_in_production');
  
  -- Decode the base64 token
  decoded_data := decode(encrypted_token, 'base64');
  
  -- Use pgp_sym_decrypt with explicit type casting
  RETURN convert_from(pgp_sym_decrypt(decoded_data, secret_key), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE LOG 'Decryption error: %', SQLERRM;
    RETURN NULL;
END;
$function$