import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { deleteUserProfile, getUserProfile, updateEmailNotifications, updateProfileCurrency } from '../../lib/api';
import { logout } from '../../lib/auth';
import ProfileScreen from '../../screens/ProfileScreen';
import { colors } from '../../theme/colors';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then((res) => {
        setUser(res?.profile || null);
        setLoading(false);
        loadedRef.current = true;
      });
    }, []),
  );

  const patchUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.logoGreen} />
      </View>
    );
  }

  return (
    <ProfileScreen
      user={user}
      isOwner={true}
      onLogout={logout}
      onUpdateCurrency={async (currency) => {
        patchUser({ currency });
        return updateProfileCurrency(currency);
      }}
      onUpdateEmailNotifications={async (enabled) => {
        patchUser({ email_notifications: enabled });
        return updateEmailNotifications(enabled);
      }}
      onDeleteAccount={deleteUserProfile}
    />
  );
}
