import { supabase } from './supabase';

export async function logout() {
  const { error } = await supabase.auth.signOut();
  return { success: !error, error: error?.message };
}
