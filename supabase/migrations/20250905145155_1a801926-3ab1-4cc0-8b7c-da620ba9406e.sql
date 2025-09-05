-- Fix the encrypt and decrypt functions to use the correct schema
CREATE OR REPLACE FUNCTION public.encrypt_api_token(token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  secret_key TEXT;
BEGIN
  -- Get or set a secret key for encryption
  secret_key := coalesce(current_setting('app.jwt_secret', true), 'default_encryption_key_change_in_production');
  
  -- Use pgp_sym_encrypt from extensions schema
  RETURN encode(extensions.pgp_sym_encrypt(token, secret_key)::bytea, 'base64');
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_api_token(encrypted_token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  secret_key TEXT;
  decoded_data bytea;
BEGIN
  -- Get the same secret key used for encryption
  secret_key := coalesce(current_setting('app.jwt_secret', true), 'default_encryption_key_change_in_production');
  
  -- Decode the base64 token to bytea
  decoded_data := decode(encrypted_token, 'base64');
  
  -- Use pgp_sym_decrypt from extensions schema
  RETURN extensions.pgp_sym_decrypt(decoded_data, secret_key);
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE LOG 'Decryption error for token: %, Error: %', substr(encrypted_token, 1, 20), SQLERRM;
    RETURN NULL;
END;
$function$;