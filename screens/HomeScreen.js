import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateFilterModal } from '../components/DateFilterModal';
import { FilterModal } from '../components/FilterModal';
import { CalendarIcon, CloseIcon, FilterIcon, SearchIcon } from '../components/Icons';
import { SportChips } from '../components/SportChips';
import TerminCard from '../components/TerminCard';
import { SPORT_ICONS } from '../data/data';
import { getTerminsPaginated, searchTermins } from '../lib/api';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const SPORT_ICON_MAP = { 'Svi sportovi': '🔥', ...SPORT_ICONS };
const PAGE_SIZE = 40;

function isTerminPast(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  return new Date(`${dateStr}T${timeStr}`) < new Date();
}

function buildSportCounts(data) {
  const counts = {};
  data.forEach((t) => {
    const raw = t.sport || '';
    const name = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    counts[name] = (counts[name] || 0) + 1;
  });
  return counts;
}

export default function HomeScreen({ userProfile }) {
  const [termini, setTermini] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedSport, setSelectedSport] = useState('Svi sportovi');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ from: null, to: null });
  const [sportCounts, setSportCounts] = useState({});

  const [filters, setFilters] = useState({
    country: '',
    cities: [],
    sortBy: 'Najnoviji',
  });

  const userCountry = userProfile?.country || userProfile?.settings?.country || '';
  const isFirstRender = useRef(true);

  const fetchTermins = useCallback(
    async (offset = 0, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const result = await getTerminsPaginated({
        sport: selectedSport,
        cities: filters.cities,
        sortBy: filters.sortBy,
        offset,
        limit: PAGE_SIZE,
        dateFrom: dateFilter.from,
        dateTo: dateFilter.to || dateFilter.from,
      });

      if (result.success) {
        if (append) {
          setTermini((prev) => [...prev, ...result.data]);
        } else {
          setTermini(result.data);
          if (selectedSport === 'Svi sportovi') setSportCounts(buildSportCounts(result.data));
        }
        setHasMore(result.hasMore);
      }
      setLoading(false);
      setLoadingMore(false);
    },
    [selectedSport, filters, dateFilter],
  );

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setIsSearchActive(false);
      fetchTermins(0);
      return;
    }
    setLoading(true);
    setIsSearchActive(true);
    const result = await searchTermins(q, PAGE_SIZE, 0, {
      cities: filters.cities,
      sport: selectedSport,
      dateFrom: dateFilter.from,
      dateTo: dateFilter.to || dateFilter.from,
    });
    if (result.success) {
      setTermini(result.data);
      setHasMore(result.hasMore);
    }
    setLoading(false);
  }, [searchQuery, fetchTermins, filters.cities, selectedSport, dateFilter]);

  const loadMoreSearch = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const result = await searchTermins(searchQuery.trim(), PAGE_SIZE, termini.length, {
      cities: filters.cities,
      sport: selectedSport,
      dateFrom: dateFilter.from,
      dateTo: dateFilter.to || dateFilter.from,
    });
    if (result.success && result.data.length > 0) {
      setTermini((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, searchQuery, termini.length, filters.cities, selectedSport, dateFilter]);

  useEffect(() => {
    fetchTermins(0);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isSearchActive) handleSearch();
    else fetchTermins(0);
  }, [selectedSport, filters, dateFilter]);

  useEffect(() => {
    const channel = supabase
      .channel('active-termins-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'termins' }, (payload) => {
        if (isSearchActive) return;
        const t = payload.new;
        const matchesSport = selectedSport === 'Svi sportovi' || t.sport?.toLowerCase() === selectedSport.toLowerCase();
        const matchesCity = filters.cities.length === 0 || filters.cities.some((c) => c.toLowerCase() === t.city?.toLowerCase());
        const matchesDate = !dateFilter.from || (t.event_date >= dateFilter.from && t.event_date <= (dateFilter.to || dateFilter.from));
        if (matchesSport && matchesCity && matchesDate) fetchTermins(0);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchTermins, isSearchActive, selectedSport, filters.cities, dateFilter]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
    fetchTermins(0);
  };

  const sportChips = useMemo(() => {
    const total = Object.values(sportCounts).reduce((a, b) => a + b, 0);
    const chips = Object.entries(sportCounts)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({ name, icon: SPORT_ICON_MAP[name] || '⚽', count }))
      .sort((a, b) => b.count - a.count);
    return [{ name: 'Svi sportovi', icon: '🔥', count: total }, ...chips];
  }, [sportCounts]);

  const displayTermini = useMemo(() => {
    return [...termini].sort((a, b) => {
      const isPastA = isTerminPast(a.event_date, a.event_time);
      const isPastB = isTerminPast(b.event_date, b.event_time);
      if (isPastA && !isPastB) return 1;
      if (!isPastA && isPastB) return -1;
      return 0;
    });
  }, [termini]);

  const handleEndReached = () => {
    if (loading || loadingMore || !hasMore) return;
    if (isSearchActive) loadMoreSearch();
    else fetchTermins(termini.length, true);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={displayTermini}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Aktivni termini u blizini</Text>

            <View style={styles.toolbar}>
              <View style={styles.searchBox}>
                <SearchIcon size={16} />
                <TextInput placeholder="Traži sport, naziv, lokaciju..." placeholderTextColor={colors.textFaint} maxLength={30} value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} style={styles.searchInput} />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={handleClearSearch} hitSlop={8}>
                    <CloseIcon size={14} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
                <Text style={styles.searchBtnText}>Traži</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <TouchableOpacity onPress={() => setDateFilterOpen(true)} style={styles.filterBtn}>
                <CalendarIcon size={16} color={colors.textSec} />
                <Text style={styles.filterBtnText}>Datum</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilterOpen(true)} style={styles.filterBtn}>
                <FilterIcon size={16} />
                <Text style={styles.filterBtnText}>Filteri</Text>
              </TouchableOpacity>
            </View>

            {!isSearchActive && <SportChips chips={sportChips} selected={selectedSport} onSelect={setSelectedSport} />}

            {loading && (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator color={colors.logoGreen} />
              </View>
            )}

            {!loading && displayTermini.length === 0 && (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <Text style={styles.emptyText}>Nema termina za odabrane kriterije.</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => <TerminCard termin={item} viewerCurrency={userProfile?.currency || 'EUR'} past={isTerminPast(item.event_date, item.event_time)} />}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.logoGreen} />
            </View>
          ) : !hasMore && displayTermini.length >= PAGE_SIZE ? (
            <Text style={styles.footerText}>Svi termini su učitani.</Text>
          ) : null
        }
      />

      <FilterModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setSelectedSport('Svi sportovi');
          setIsSearchActive(false);
          setSearchQuery('');
        }}
        userCountry={userCountry}
      />

      <DateFilterModal visible={dateFilterOpen} onClose={() => setDateFilterOpen(false)} value={dateFilter} onApply={setDateFilter} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  brandText: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 15,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.6,
    marginTop: 8,
    marginBottom: 16,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  searchBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.logoGreen,
  },
  searchBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  filterBtnText: {
    color: colors.textSec,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    color: colors.textSec,
    fontSize: 14,
  },
  footerText: {
    textAlign: 'center',
    color: colors.textFaint,
    fontSize: 12,
    paddingVertical: 16,
  },
});
