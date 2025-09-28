-- Cleanup broken admin setup to start fresh
-- Run this first to undo the problematic changes

-- Drop the problematic policies FIRST (they depend on the functions)
DROP POLICY IF EXISTS "Authenticated users can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin_users" ON admin_users;

-- Drop the admin-only policies (they use the is_admin() function)
DROP POLICY IF EXISTS "Admin write access" ON tournaments;
DROP POLICY IF EXISTS "Admin write access" ON year_configs;
DROP POLICY IF EXISTS "Admin write access" ON tournament_results;
DROP POLICY IF EXISTS "Admin write access" ON ytd_standings;
DROP POLICY IF EXISTS "Admin write access" ON points_config;
DROP POLICY IF EXISTS "Admin write access" ON players;

-- NOW drop the functions (after policies that depend on them are gone)
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_super_admin();

-- Restore original authenticated write policies
CREATE POLICY "Authenticated write access" ON players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON tournaments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON tournament_results FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON ytd_standings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON year_configs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON points_config FOR ALL USING (auth.role() = 'authenticated');

-- Temporarily disable RLS on admin_users to allow login to work
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;