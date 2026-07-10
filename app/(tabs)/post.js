import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createTermin, getUserProfile } from '../../lib/api';
import PostForm from '../../screens/PostForm';
import { colors } from '../../theme/colors';

export default function Post() {
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

  return <PostForm userProfile={profile} onCreateTermin={createTermin} />;
}
