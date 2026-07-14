import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { deleteUserProfile, getUserProfile, updateEmailNotifications, updateProfileCurrency } from '../../lib/api';
import { logout } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import ProfileScreen from '../../screens/ProfileScreen';
import { colors } from '../../theme/colors';

export default function Profile() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    getUserProfile().then((res) => {
      setUser(res?.profile || null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!authUser?.id) return;

    const channel = supabase
      .channel(`profile-live-${authUser.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${authUser.id}` }, (payload) => {
        setUser((prev) => (prev ? { ...prev, ...payload.new } : payload.new));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [authUser?.id]);

  const handleOptimisticUpdate = useCallback((patch) => {
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
        handleOptimisticUpdate({ currency });
        return updateProfileCurrency(currency);
      }}
      onUpdateEmailNotifications={async (enabled) => {
        handleOptimisticUpdate({ email_notifications: enabled });
        return updateEmailNotifications(enabled);
      }}
      onDeleteAccount={deleteUserProfile}
    />
  );
}
