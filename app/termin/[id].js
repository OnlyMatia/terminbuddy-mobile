import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import { getTerminChatPreview, getTerminDetails, getUserProfile } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import TerminDetailScreen from '../../screens/TerminDetailScreen';
import { colors } from '../../theme/colors';

export default function TerminDetail() {
  const { id } = useLocalSearchParams();
  const { clearTerminNotifForId } = useNotifications();
  const [termin, setTermin] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatPreview, setChatPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const terminRef = useRef(null);
  useEffect(() => {
    terminRef.current = termin;
  }, [termin]);

  const load = useCallback(async () => {
    setLoading(true);
    const [result, userRes] = await Promise.all([getTerminDetails(id), getUserProfile()]);

    if (!result?.success) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const terminData = result.data;
    const user = userRes?.profile || null;
    setCurrentUser(user);

    const isOwner = user?.id === terminData.creator_id;
    const isRegistered = terminData.registered_players?.includes(user?.id);

    if (isOwner || isRegistered) {
      const chatResult = await getTerminChatPreview(terminData.id);
      if (chatResult.success) setChatPreview(chatResult.data);
    }

    setTermin(terminData);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    clearTerminNotifForId(id);
  }, [id, clearTerminNotifForId]);

  useEffect(() => {
    const channel = supabase
      .channel(`termin-live-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'termins', filter: `id=eq.${id}` }, async (payload) => {
        const updated = payload.new;
        const prev = terminRef.current;
        if (!prev) return;

        const ids = updated.registered_players || [];
        const existing = prev.registered_profiles || [];
        const existingIds = new Set(existing.map((p) => p.id));
        const missingIds = ids.filter((pid) => !existingIds.has(pid));

        let newProfiles = [];
        if (missingIds.length > 0) {
          const { data } = await supabase.from('profiles').select('id, username, avatar_url').in('id', missingIds);
          newProfiles = data || [];
        }

        const registered_profiles = [...existing.filter((p) => ids.includes(p.id)), ...newProfiles];

        setTermin((cur) =>
          cur
            ? {
                ...cur,
                ...updated,
                registered_profiles,
                profiles: cur.profiles,
                termin_requests: cur.termin_requests,
                currentUserRequestStatus: cur.currentUserRequestStatus,
              }
            : cur,
        );
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'termin_requests', filter: `termin_id=eq.${id}` }, async () => {
        const prev = terminRef.current;
        if (!prev) return;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const updates = {};

        const { data: myRequest } = await supabase.from('termin_requests').select('status').eq('termin_id', id).eq('user_id', user.id).maybeSingle();
        updates.currentUserRequestStatus = myRequest?.status || null;

        if (prev.creator_id === user.id) {
          const { data: allRequests } = await supabase.from('termin_requests').select('*, profiles:user_id(username, avatar_url)').eq('termin_id', id).order('created_at', { ascending: true });
          updates.termin_requests = allRequests || [];
        }

        setTermin((cur) => (cur ? { ...cur, ...updates } : cur));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.logoGreen} />
      </SafeAreaView>
    );
  }

  if (notFound || !termin) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: colors.textSec }}>Termin nije pronađen...</Text>
      </SafeAreaView>
    );
  }

  return <TerminDetailScreen termin={termin} currentUser={currentUser} chatPreview={chatPreview} viewerCurrency={currentUser?.currency || 'KM'} onRefresh={load} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
