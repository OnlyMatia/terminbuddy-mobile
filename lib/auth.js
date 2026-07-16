import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';

export async function logout() {
  const { error } = await supabase.auth.signOut();

  try {
    const hasPrevious = await GoogleSignin.hasPreviousSignIn();
    if (hasPrevious) await GoogleSignin.signOut();
  } catch (err) {
    console.warn('Google sign-out failed:', err);
  }

  return { success: !error, error: error?.message };
}
