import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { colors } from '../theme/colors';

function RootNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const { session, initializing, onboardingComplete } = useAuth();

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === 'login';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && !onboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (session && onboardingComplete && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [session, initializing, onboardingComplete, segments]);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.logoGreen} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <StatusBar style="light" />
        <RootNavigation />
      </ThemeProvider>
    </AuthProvider>
  );
}
