# Admin User Setup Guide

This guide explains how to set up admin authentication for the WESPA YTD Rankings system.

## 🔐 Current Authentication Flow

1. User logs in with email/password via Supabase Auth
2. System checks if user exists in `admin_users` table with active status
3. If yes, grants admin access; if no, denies access

## 🛠️ Initial Setup

### Step 1: Run the Admin Setup SQL

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-admin-setup.sql`
4. Execute the script

This creates:
- `admin_users` table for role management
- Helper functions (`is_admin()`, `is_super_admin()`)
- Updated RLS policies that require admin access

### Step 2: Create Your First Admin User

#### Option A: Manual Setup (Recommended)

1. **Create the user in Supabase Auth:**
   - Go to **Authentication** → **Users** in Supabase dashboard
   - Click **"Add user"**
   - Enter email and password
   - Note the user's UUID from the users list

2. **Add them to admin_users table:**
   ```sql
   INSERT INTO admin_users (user_id, email, role, is_active)
   VALUES (
     'USER_UUID_FROM_STEP_1',
     'admin@yourorg.com',
     'super_admin',
     true
   );
   ```

#### Option B: Self-Registration + Manual Approval

1. **Enable signups temporarily:**
   - Go to **Authentication** → **Settings**
   - Enable "Enable email confirmations"
   - Set "Site URL" to your domain

2. **Register yourself:**
   - Go to `/login` on your site
   - Register with your admin email
   - Confirm email if required

3. **Add yourself to admin_users:**
   ```sql
   INSERT INTO admin_users (user_id, email, role, is_active)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
     'your-email@example.com',
     'super_admin',
     true
   );
   ```

4. **Disable public signups:**
   ```sql
   -- Disable future registrations
   UPDATE auth.config SET enable_signup = false;
   ```

### Step 3: Test Admin Access

1. Go to `/login`
2. Sign in with your admin credentials
3. You should be redirected to `/admin`

## 👥 Managing Additional Admins

### Add New Admin

```sql
-- First, create user in Supabase Auth dashboard, then:
INSERT INTO admin_users (user_id, email, role, is_active)
VALUES (
  'NEW_USER_UUID',
  'new-admin@yourorg.com',
  'admin',  -- or 'super_admin'
  true
);
```

### Deactivate Admin

```sql
UPDATE admin_users
SET is_active = false
WHERE email = 'admin-to-remove@yourorg.com';
```

### List All Admins

```sql
SELECT
  au.email,
  au.role,
  au.is_active,
  au.created_at,
  u.email_confirmed_at
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;
```

## 🔒 Security Features

### Role Types

- **`admin`**: Can manage tournaments, points, and calculations
- **`super_admin`**: Can manage everything + add/remove other admins

### Database Security

- **Row Level Security (RLS)**: All admin tables require `is_admin()` function
- **Function Security**: Auth functions use `SECURITY DEFINER`
- **Public Read Access**: Standings and tournaments remain publicly readable

### Application Security

- Login page checks admin status after authentication
- Admin pages verify access on load
- Invalid access attempts are logged out immediately

## 🚨 Important Security Notes

1. **Disable Public Signups**: Always disable public registration after setup
2. **Use Strong Passwords**: Enforce strong passwords for admin accounts
3. **Regular Audits**: Periodically review admin_users table
4. **Email Confirmation**: Keep email confirmation enabled
5. **Backup Access**: Always have at least one super_admin

## 🛠️ Troubleshooting

### "Admin access required" Error

- User not in `admin_users` table
- User's `is_active` is false
- Database permissions issue

### Can't Access Admin Panel

- Check if user exists: `SELECT * FROM admin_users WHERE email = 'your-email';`
- Check if user is active: `SELECT is_admin();` (while logged in)
- Verify RLS policies are applied correctly

### Lost Admin Access

```sql
-- Emergency: Add yourself as super admin (requires database access)
INSERT INTO admin_users (user_id, email, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your-recovery-email@example.com'),
  'your-recovery-email@example.com',
  'super_admin',
  true
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  is_active = true;
```

## 📝 Environment Variables

No additional environment variables needed for admin authentication - it uses the same Supabase connection as the rest of the app.