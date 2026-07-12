import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { deleteUserProfile, getUserProfile, updateEmailNotifications, updateProfileCurrency } from '../../lib/api';
import { logout } from '../../lib/auth';
import ProfileScreen from '../../screens/ProfileScreen';
import { colors } from '../../theme/colors';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then((res) => {
        setUser(res?.profile || null);
        setLoading(false);
      });
    }, []),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.logoGreen} />
      </View>
    );
  }

  return <ProfileScreen user={user} isOwner={true} onLogout={logout} onUpdateCurrency={updateProfileCurrency} onUpdateEmailNotifications={updateEmailNotifications} onDeleteAccount={deleteUserProfile} />;
}
