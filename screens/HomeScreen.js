import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateFilterModal } from '../components/DateFilterModal';
import { FilterModal } from '../components/FilterModal';
import { CalendarIcon, CloseIcon, FilterIcon, SearchIcon } from '../components/Icons';
import { SportChips } from '../components/SportChips';
import TerminCard from '../components/TerminCard';
import { getSportIcon } from '../data/data';
import { getTerminsPaginated, searchTermins } from '../lib/api';
import { registerHomeScrollToTop } from '../lib/homeScrollRegistry';
import { colors } from '../theme/colors';

const PAGE_SIZE = 30;

function isTerminPast(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  return new Date(`${dateStr}T${timeStr}`) < new Date();
}

function buildEmptyMessage(filters, dateFilter) {
  const hasLocation = filters.cities && filters.cities.length > 0;
  const hasDate = !!dateFilter.from;

  if (hasDate && hasLocation) {
    return `Nema termina u ovom vremenskom rasponu za ${filters.cities.join(', ')}.`;
  }
  if (hasDate) {
    return 'Nema termina u ovom vremenskom rasponu.';
  }
  if (hasLocation) {
    return `Nema termina za ovu lokaciju (${filters.cities.join(', ')}).`;
  }
  return 'Nema termina za odabrane kriterije.';
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
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState(() => {
    const country = userProfile?.country || userProfile?.settings?.country || '';
    const city = userProfile?.location || userProfile?.settings?.city || '';
    return {
      country,
      cities: city ? [city] : [],
      sortBy: 'Najnoviji',
    };
  });

  const userCountry = userProfile?.country || userProfile?.settings?.country || '';
  const isFirstRender = useRef(true);
  const listRef = useRef(null);

  useEffect(() => {
    registerHomeScrollToTop(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return () => registerHomeScrollToTop(null);
  }, []);

  const fetchTermins = useCallback(
    async (offset = 0, append = false, silent = false) => {
      if (append) setLoadingMore(true);
      else if (!silent) setLoading(true);

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
      setRefreshing(false);
    },
    [selectedSport, filters, dateFilter],
  );

  const handleSearch = useCallback(
    async (silent = false) => {
      const q = searchQuery.trim();
      if (!q) {
        setIsSearchActive(false);
        fetchTermins(0, false, silent);
        return;
      }
      if (!silent) setLoading(true);
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
      setRefreshing(false);
    },
    [searchQuery, fetchTermins, filters.cities, selectedSport, dateFilter],
  );

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

  const refreshRef = useRef(null);
  refreshRef.current = (silent = false) => {
    if (isSearchActive) handleSearch(silent);
    else fetchTermins(0, false, silent);
  };

  const initialLoadedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!initialLoadedRef.current) {
        initialLoadedRef.current = true;
        refreshRef.current?.(false);
      } else {
        refreshRef.current?.(true);
      }
    }, []),
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isSearchActive) handleSearch();
    else fetchTermins(0);
  }, [selectedSport, filters, dateFilter]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
    fetchTermins(0);
  };

  const sportChips = useMemo(() => {
    const total = Object.values(sportCounts).reduce((a, b) => a + b, 0);
    const chips = Object.entries(sportCounts)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({ name, icon: getSportIcon(name), count }))
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
        ref={listRef}
        data={displayTermini}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              refreshRef.current?.(true);
            }}
            tintColor={colors.logoGreen}
            colors={[colors.logoGreen]}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Aktivni termini</Text>

            <View style={styles.toolbar}>
              <View style={styles.searchBox}>
                <SearchIcon size={16} />
                <TextInput placeholder="Pretraži termine" placeholderTextColor={colors.textFaint} maxLength={30} value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} style={styles.searchInput} />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={handleClearSearch} hitSlop={8}>
                    <CloseIcon size={14} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
                <Text style={styles.searchBtnText}>Traži</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDateFilterOpen(true)} style={styles.iconBtn}>
                <CalendarIcon size={22} color={colors.textSec} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilterOpen(true)} style={styles.iconBtn}>
                <FilterIcon size={22} />
              </TouchableOpacity>
            </View>

            {!isSearchActive && <SportChips chips={sportChips} selected={selectedSport} onSelect={setSelectedSport} />}

            {loading && (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator color={colors.logoGreen} />
              </View>
            )}

            {!loading && displayTermini.length === 0 && (
              <View style={{ paddingVertical: 60, alignItems: 'center', paddingHorizontal: 32 }}>
                <Text style={styles.emptyText}>{buildEmptyMessage(filters, dateFilter)}</Text>
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
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
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.logoGreen,
  },
  searchBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  emptyText: {
    color: colors.textSec,
    fontSize: 14,
    textAlign: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: colors.textFaint,
    fontSize: 12,
    paddingVertical: 16,
  },
});
