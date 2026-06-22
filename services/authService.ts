import { supabase } from '@/lib/supabase';
import { DEV_AUTH_ENABLED, DEV_USER } from '@/lib/devAuth';

export async function getCurrentUser() {
  if (DEV_AUTH_ENABLED) return DEV_USER;

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  if (DEV_AUTH_ENABLED) return;
  await supabase.auth.signOut();
}
