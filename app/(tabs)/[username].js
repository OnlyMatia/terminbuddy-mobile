import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getProfileByUsername } from '../../lib/api';
import ProfileScreen from '../../screens/ProfileScreen';
import { colors } from '../../theme/colors';

export default function PublicProfile() {
  const { username } = useLocalSearchParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getProfileByUsername(username).then((res) => {
      if (!res.success) {
        setNotFound(true);
      } else {
        setProfile(res.profile);
      }
      setLoading(false);
    });
  }, [username]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.logoGreen} />
      </View>
    );
  }

  if (notFound || !profile) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textSec }}>Korisnik nije pronađen.</Text>
      </View>
    );
  }

  const isOwner = user?.id === profile.id;

  return <ProfileScreen user={profile} isOwner={isOwner} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
