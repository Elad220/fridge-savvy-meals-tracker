-- Fix critical RLS policy vulnerabilities on meal_plans table
-- Drop existing insecure policies
DROP POLICY IF EXISTS "Allow authenticated users to insert meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Allow authenticated users to update their own meal plans" ON public.meal_plans;

-- Create secure policies that properly restrict user_id
CREATE POLICY "Users can insert their own meal plans" 
ON public.meal_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans" 
ON public.meal_plans 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add search_path to all database functions for security
CREATE OR REPLACE FUNCTION public.encrypt_api_token(token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  secret_key TEXT;
BEGIN
  -- Get or set a secret key for encryption
  secret_key := coalesce(current_setting('app.jwt_secret', true), 'default_encryption_key_change_in_production');
  
  -- Use pgp_sym_encrypt for symmetric encryption
  RETURN encode(pgp_sym_encrypt(token, secret_key), 'base64');
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_api_token(encrypted_token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  secret_key TEXT;
BEGIN
  -- Get the same secret key used for encryption
  secret_key := coalesce(current_setting('app.jwt_secret', true), 'default_encryption_key_change_in_production');
  
  -- Use pgp_sym_decrypt for symmetric decryption
  RETURN pgp_sym_decrypt(decode(encrypted_token, 'base64'), secret_key);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_decrypted_api_token(p_token_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.store_api_token(p_token_name text, p_api_token text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_consumption_pattern(p_user_id uuid, p_item_name text, p_quantity integer, p_unit text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.consumption_patterns (
    user_id, 
    item_name, 
    typical_quantity, 
    typical_unit, 
    last_purchase_date,
    times_purchased
  )
  VALUES (
    p_user_id, 
    p_item_name, 
    p_quantity, 
    p_unit, 
    CURRENT_DATE,
    1
  )
  ON CONFLICT (user_id, item_name) 
  DO UPDATE SET
    typical_quantity = (consumption_patterns.typical_quantity * consumption_patterns.times_purchased + EXCLUDED.typical_quantity) / (consumption_patterns.times_purchased + 1),
    typical_unit = EXCLUDED.typical_unit,
    last_purchase_date = EXCLUDED.last_purchase_date,
    times_purchased = consumption_patterns.times_purchased + 1,
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_api_token_test(token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$DECLARE
    encrypted_token text;
BEGIN
    encrypted_token := encode(digest(token, 'sha256'), 'hex');
    INSERT INTO public.user_api_tokens (encrypted_token) VALUES (encrypted_token);
    RETURN encrypted_token;
END;$function$;