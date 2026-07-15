import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { getUserCreatedTermins, getUserJoinedTermins, getUserProfile } from '../../lib/api';
import MyTerminsScreen from '../../screens/MyTerminsScreen';

export default function MyTermins() {
  const { clearTerminNotifs } = useNotifications();
  const [createdData, setCreatedData] = useState([]);
  const [joinedData, setJoinedData] = useState([]);
  const [viewerCurrency, setViewerCurrency] = useState('EUR');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedRef = useRef(false);

  const load = useCallback(async ({ silent = false, pull = false } = {}) => {
    if (pull) setRefreshing(true);
    else if (!silent) setLoading(true);

    const [createdRes, joinedRes, userRes] = await Promise.all([getUserCreatedTermins(), getUserJoinedTermins(), getUserProfile()]);

    setCreatedData(createdRes.success ? createdRes.data : []);
    setJoinedData(joinedRes.success ? joinedRes.data : []);
    if (userRes?.profile?.currency) setViewerCurrency(userRes.profile.currency);

    setLoading(false);
    setRefreshing(false);
    loadedRef.current = true;
  }, []);

  useFocusEffect(
    useCallback(() => {
      load({ silent: loadedRef.current });
      clearTerminNotifs();
    }, [load, clearTerminNotifs]),
  );

  return <MyTerminsScreen createdData={createdData} joinedData={joinedData} viewerCurrency={viewerCurrency} loading={loading} onRefresh={() => load({ pull: true })} refreshing={refreshing} />;
}
