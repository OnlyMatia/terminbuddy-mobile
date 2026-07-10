import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { completeOnboarding, editProfile, getUserProfile, updateAvatar } from '../lib/api';
import OnboardingScreen from '../screens/OnboardingScreen';
import { colors } from '../theme/colors';

export default function Onboarding() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { refreshOnboardingStatus } = useAuth();
  const editMode = params.edit === 'true';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserProfile().then((res) => {
      setProfile(res?.profile || null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.logoGreen} />
      </View>
    );
  }

  return (
    <OnboardingScreen
      user={profile}
      editMode={editMode}
      onUploadAvatar={updateAvatar}
      onFinish={async (payload) => {
        const result = await completeOnboarding(payload);
        if (result.success) {
          await refreshOnboardingStatus();
          router.replace('/(tabs)');
        }
        return result;
      }}
      onEditFinish={async (payload) => {
        const result = await editProfile(payload);
        if (result.success) router.back();
        return result;
      }}
      onClose={() => router.back()}
    />
  );
}
