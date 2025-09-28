import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
}

export async function checkAdminAccess(): Promise<AdminUser | null> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function requireAdminAccess(): Promise<AdminUser> {
  const admin = await checkAdminAccess();

  if (!admin) {
    throw new Error('Admin access required');
  }

  return admin;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const admin = await checkAdminAccess();
  return admin !== null;
}

export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  const admin = await checkAdminAccess();
  return admin?.role === 'super_admin';
}