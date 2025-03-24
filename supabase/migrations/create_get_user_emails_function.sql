-- Create a function to get real user emails
CREATE OR REPLACE FUNCTION get_user_emails()
RETURNS TABLE (
  user_id UUID,
  email TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id as user_id,
    au.email
  FROM
    auth.users au;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_emails() TO service_role;
