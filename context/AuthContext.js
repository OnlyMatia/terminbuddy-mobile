import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

const AuthContext = createContext({
  session: null,
  user: null,
  initializing: true,
  onboardingComplete: false,
  login: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  refreshOnboardingStatus: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const checkOnboarding = useCallback(async (userId) => {
    if (!userId) {
      setOnboardingComplete(false);
      return;
    }

    const { data } = await supabase.from('profiles').select('is_onboarded').eq('id', userId).single();

    setOnboardingComplete(!!data?.is_onboarded);
  }, []);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      await checkOnboarding(initialSession?.user?.id);
      if (isMounted) setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      checkOnboarding(newSession?.user?.id);
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [checkOnboarding]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        return { success: false, error: 'Prijava otkazana.' };
      }

      const idToken = response.data?.idToken;
      if (!idToken) {
        return { success: false, error: 'Google nije vratio token.' };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) return { success: false, error: error.message };

      return { success: true };
    } catch (err) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          return { success: false, error: null };
        }
        if (err.code === statusCodes.IN_PROGRESS) {
          return { success: false, error: 'Prijava je već u tijeku.' };
        }
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          return { success: false, error: 'Google Play Services nije dostupan.' };
        }
      }
      return { success: false, error: err.message || 'Nešto je pošlo po zlu.' };
    }
  };

  const refreshOnboardingStatus = () => checkOnboarding(session?.user?.id);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        initializing,
        onboardingComplete,
        login,
        signUp,
        signInWithGoogle,
        refreshOnboardingStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
