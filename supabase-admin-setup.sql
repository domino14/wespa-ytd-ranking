-- Admin user management for WESPA YTD Rankings

-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow authenticated users to read admin_users
-- This avoids circular dependency by not using helper functions
CREATE POLICY "Authenticated users can read admin_users"
ON admin_users FOR SELECT
USING (auth.role() = 'authenticated');

-- For admin management, we'll rely on application-level security
-- rather than complex RLS policies that can cause circular dependencies

-- Update existing RLS policies to require admin access
-- (Only admins can modify tournaments, year_configs, etc.)

-- Drop existing policies for admin-only tables
DROP POLICY IF EXISTS "Authenticated write access" ON tournaments;
DROP POLICY IF EXISTS "Authenticated write access" ON year_configs;
DROP POLICY IF EXISTS "Authenticated write access" ON tournament_results;
DROP POLICY IF EXISTS "Authenticated write access" ON ytd_standings;
DROP POLICY IF EXISTS "Authenticated write access" ON points_config;

-- Create admin-only write policies using direct SQL queries (avoiding circular dependency)
-- These directly check the admin_users table without using helper functions

CREATE POLICY "Admin write access" ON tournaments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Admin write access" ON year_configs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Admin write access" ON tournament_results
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Admin write access" ON ytd_standings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Admin write access" ON points_config
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Admin write access" ON players
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Create index for performance
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- Insert your first super admin user
-- REPLACE 'your-email@example.com' with your actual email
-- You'll need to create this user in Supabase Auth first, then run this

-- Step 1: Create user in Supabase Auth dashboard first
-- Step 2: Then run this query with the user's UUID
/*
INSERT INTO admin_users (user_id, email, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
  'your-email@example.com',
  'super_admin',
  true
);
*/