import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getUserProfile } from '../../lib/api';
import HomeScreen from '../../screens/HomeScreen';
import { colors } from '../../theme/colors';

export default function Home() {
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

  return <HomeScreen userProfile={profile} />;
}
