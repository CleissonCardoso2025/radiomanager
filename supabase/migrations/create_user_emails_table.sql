-- Create a table to store real user emails
CREATE TABLE IF NOT EXISTS user_emails (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for the user_emails table
CREATE POLICY "Users can view all user emails"
  ON user_emails
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert user emails"
  ON user_emails
  FOR INSERT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update user emails"
  ON user_emails
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON user_emails TO service_role;
GRANT SELECT, INSERT, UPDATE ON user_emails TO authenticated;
