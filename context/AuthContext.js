import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

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
    const redirectTo = makeRedirectUri({ scheme: 'terminbuddy', path: 'auth/callback' });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw new Error(error.message);

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) return;

    const { params, errorCode } = QueryParams.getQueryParams(result.url);
    if (errorCode) throw new Error(errorCode);

    const { access_token, refresh_token } = params;
    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) throw new Error(sessionError.message);
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
