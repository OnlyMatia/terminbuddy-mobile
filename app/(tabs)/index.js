import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTerminsPaginated, searchTermins, getUserProfile } from '../../lib/actions';
import { supabase } from '../../lib/supabase';
import TerminCard from '../../components/TerminCard';
import { theme } from '../../constants/theme';

const PAGE_SIZE = 40;

function isPast(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  return new Date(`${dateStr}T${timeStr}`) < new Date();
}

export default function Home() {
  const [termini, setTermini] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [profile, setProfile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, prof] = await Promise.all([
      getTerminsPaginated({ limit: PAGE_SIZE, offset: 0 }),
      getUserProfile(),
    ]);
    if (res.success) {
      setTermini(res.data);
      setHasMore(res.hasMore);
    }
    setProfile(prof);
    setLoading(false);
    setSearchActive(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('mobile-termins-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'termins' },
        () => {
          if (!searchActive) load();
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load, searchActive]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return load();
    setLoading(true);
    setSearchActive(true);
    const res = await searchTermins(q, PAGE_SIZE, 0, {});
    if (res.success) {
      setTermini(res.data);
      setHasMore(res.hasMore);
    }
    setLoading(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || searchActive) return;
    setLoadingMore(true);
    const res = await getTerminsPaginated({
      limit: PAGE_SIZE,
      offset: termini.length,
    });
    if (res.success) {
      setTermini((prev) => [...prev, ...res.data]);
      setHasMore(res.hasMore);
    }
    setLoadingMore(false);
  };

  const sorted = [...termini].sort((a, b) => {
    const pa = isPast(a.event_date, a.event_time);
    const pb = isPast(b.event_date, b.event_time);
    if (pa && !pb) return 1;
    if (!pa && pb) return -1;
    return 0;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>Aktivni termini u blizini</Text>
        <View style={styles.searchBox}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Traži sport, naziv, lokaciju..."
            placeholderTextColor={theme.textFaint}
            style={styles.searchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Pressable style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Traži</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.logoGreen} />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TerminCard
              {...item}
              past={isPast(item.event_date, item.event_time)}
              currency={profile?.currency || 'EUR'}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.logoGreen}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={theme.logoGreen} style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Nema termina za odabrane kriterije.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.background },
  headerWrap: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  title: { color: theme.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  searchBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.bg2,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 16,
    padding: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchBtn: {
    backgroundColor: theme.logoGreen,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#000', fontWeight: '600', fontSize: 13 },
  list: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: theme.textSec, textAlign: 'center', marginTop: 60, fontSize: 15 },
});