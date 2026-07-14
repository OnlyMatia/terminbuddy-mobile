import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getUserCreatedTermins, getUserJoinedTermins, getUserProfile } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import MyTerminsScreen from '../../screens/MyTerminsScreen';

export default function MyTermins() {
  const { clearTerminNotifs } = useNotifications();
  const { user: authUser } = useAuth();
  const [createdData, setCreatedData] = useState([]);
  const [joinedData, setJoinedData] = useState([]);
  const [viewerCurrency, setViewerCurrency] = useState('EUR');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedRef = useRef(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!loadedRef.current) setLoading(true);

    const [createdRes, joinedRes, userRes] = await Promise.all([getUserCreatedTermins(), getUserJoinedTermins(), getUserProfile()]);

    setCreatedData(createdRes.success ? createdRes.data : []);
    setJoinedData(joinedRes.success ? joinedRes.data : []);
    if (userRes?.profile?.currency) setViewerCurrency(userRes.profile.currency);

    setLoading(false);
    setRefreshing(false);
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      clearTerminNotifs();
    }, [clearTerminNotifs]),
  );

  useEffect(() => {
    if (!authUser?.id) return;

    const channel = supabase
      .channel('my-termins-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'termins' }, (payload) => {
        const t = payload.new;

        setCreatedData((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...t } : x)));

        setJoinedData((prev) => {
          const wasJoined = prev.some((x) => x.id === t.id);
          const isNowJoined = Array.isArray(t.registered_players) && t.registered_players.includes(authUser.id) && t.creator_id !== authUser.id;

          if (wasJoined && !isNowJoined) return prev.filter((x) => x.id !== t.id);
          if (wasJoined && isNowJoined) return prev.map((x) => (x.id === t.id ? { ...x, ...t } : x));
          if (!wasJoined && isNowJoined) return [t, ...prev];
          return prev;
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'termins' }, async (payload) => {
        const t = payload.new;
        if (t.creator_id !== authUser.id) return;

        const { data: prof } = await supabase.from('profiles').select('username, avatar_url').eq('id', t.creator_id).single();

        setCreatedData((prev) => {
          if (prev.some((x) => x.id === t.id)) return prev;
          return [{ ...t, profiles: prof }, ...prev];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'termins' }, (payload) => {
        const oldId = payload.old?.id;
        if (!oldId) return;
        setCreatedData((prev) => prev.filter((x) => x.id !== oldId));
        setJoinedData((prev) => prev.filter((x) => x.id !== oldId));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [authUser?.id]);

  return <MyTerminsScreen createdData={createdData} joinedData={joinedData} viewerCurrency={viewerCurrency} loading={loading} onRefresh={() => load(true)} refreshing={refreshing} />;
}
