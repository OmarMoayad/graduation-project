-- Fix search_path for handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create organization for new user
  INSERT INTO public.organizations (name, code)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Organization',
    'ORG-' || substring(NEW.id::text from 1 for 8)
  )
  RETURNING id INTO new_org_id;
  
  -- Create profile linked to organization
  INSERT INTO public.profiles (id, organization_id, full_name, email)
  VALUES (
    NEW.id,
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  RETURN NEW;
END;
$function$;