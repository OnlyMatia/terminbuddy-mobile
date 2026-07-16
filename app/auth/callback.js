import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          const { params, errorCode } = QueryParams.getQueryParams(url);
          if (errorCode) throw new Error(errorCode);

          const { access_token, refresh_token } = params;
          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) throw sessionError;
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) {
          setTimeout(() => router.replace('/'), 300);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <ActivityIndicator color={colors.logoGreen} />
      {error && <Text style={{ color: colors.textSec, fontSize: 13, paddingHorizontal: 24, textAlign: 'center' }}>{error}</Text>}
    </View>
  );
}
