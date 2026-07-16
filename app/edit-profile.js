import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { editProfile, getUserProfile, updateAvatar } from '../lib/api';
import OnboardingScreen from '../screens/OnboardingScreen';
import { colors } from '../theme/colors';

export default function EditProfile() {
  const router = useRouter();

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
      editMode={true}
      onUploadAvatar={updateAvatar}
      onEditFinish={async (payload) => {
        const result = await editProfile(payload);
        if (result.success) router.back();
        return result;
      }}
      onClose={() => router.back()}
    />
  );
}
