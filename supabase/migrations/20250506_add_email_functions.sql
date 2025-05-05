
-- Create a function to add user emails
CREATE OR REPLACE FUNCTION public.add_user_email(p_user_id UUID, p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user has admin privileges (for security)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  -- Insert or update the email
  INSERT INTO public.user_emails (user_id, email)
  VALUES (p_user_id, p_email)
  ON CONFLICT (user_id) 
  DO UPDATE SET email = p_email, created_at = NOW();
END;
$$;

-- Enhance get_user_emails function to read from user_emails table
CREATE OR REPLACE FUNCTION public.get_user_emails()
RETURNS TABLE (
  id UUID,
  email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to get emails from user_emails table first
  RETURN QUERY
  SELECT
    ue.user_id as id,
    ue.email
  FROM
    public.user_emails ue;
    
  -- If no results, fall back to auth.users (requires admin privileges)
  IF NOT FOUND AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN QUERY
    SELECT
      au.id,
      au.email
    FROM
      auth.users au;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_user_email(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_emails() TO authenticated;
