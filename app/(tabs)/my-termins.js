import { useCallback, useEffect, useState } from 'react';
import { getUserCreatedTermins, getUserJoinedTermins, getUserProfile } from '../../lib/api';
import MyTerminsScreen from '../../screens/MyTerminsScreen';

export default function MyTermins() {
  const [createdData, setCreatedData] = useState([]);
  const [joinedData, setJoinedData] = useState([]);
  const [viewerCurrency, setViewerCurrency] = useState('EUR');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const [createdRes, joinedRes, userRes] = await Promise.all([getUserCreatedTermins(), getUserJoinedTermins(), getUserProfile()]);

    setCreatedData(createdRes.success ? createdRes.data : []);
    setJoinedData(joinedRes.success ? joinedRes.data : []);
    if (userRes?.profile?.currency) setViewerCurrency(userRes.profile.currency);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <MyTerminsScreen createdData={createdData} joinedData={joinedData} viewerCurrency={viewerCurrency} loading={loading} onRefresh={() => load(true)} refreshing={refreshing} />;
}
