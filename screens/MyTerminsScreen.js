import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlusIcon } from '../components/Icons';
import TerminCard from '../components/TerminCard';
import { useNotifications } from '../context/NotificationContext';
import { colors, radius } from '../theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');

function isTerminPast(dateStr, timeStr) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (timeStr) {
    const [h, min] = timeStr.split(':').map(Number);
    return new Date(y, m - 1, d, h, min) < new Date();
  }
  return new Date(y, m - 1, d, 23, 59, 59) < new Date();
}

function sortActiveFirst(list) {
  return [...list].sort((a, b) => {
    const pastA = isTerminPast(a.event_date, a.event_time);
    const pastB = isTerminPast(b.event_date, b.event_time);
    if (pastA && !pastB) return 1;
    if (!pastA && pastB) return -1;
    return 0;
  });
}

const TABS = [
  { key: 'created', label: 'Organiziram' },
  { key: 'joined', label: 'Igram' },
];

export default function MyTerminsScreen({ createdData, joinedData, viewerCurrency = 'EUR', loading, onRefresh, refreshing }) {
  const router = useRouter();
  const { unreadTerminIds } = useNotifications();
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef(null);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const created = useMemo(() => sortActiveFirst(createdData || []), [createdData]);
  const joined = useMemo(() => sortActiveFirst(joinedData || []), [joinedData]);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14,
    }).start();
  }, [activeIndex, indicatorAnim]);

  const goToTab = (idx) => {
    setActiveIndex(idx);
    pagerRef.current?.scrollToOffset({ offset: idx * SCREEN_W, animated: true });
  };

  const onMomentumScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const renderEmpty = (tabKey) => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.logoGreen} />
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>{tabKey === 'created' ? 'Još nisi objavio nijedan termin.' : 'Još se nisi pridružio nijednom terminu.'}</Text>
        <Text style={styles.emptyDesc}>{tabKey === 'created' ? 'Objavi svoj prvi termin i skupi ekipu.' : 'Pronađi termin na početnoj i prijavi se.'}</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push(tabKey === 'created' ? '/(tabs)/post' : '/(tabs)')} activeOpacity={0.9}>
          {tabKey === 'created' && <PlusIcon size={16} color="#000" />}
          <Text style={styles.emptyBtnText}>{tabKey === 'created' ? 'Objavi termin' : 'Istraži termine'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderList = ({ item: tab }) => {
    const list = tab.key === 'created' ? created : joined;
    return (
      <View style={{ width: SCREEN_W }}>
        <FlatList
          data={loading ? [] : list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.logoGreen} colors={[colors.logoGreen]} />}
          renderItem={({ item }) => <TerminCard termin={item} viewerCurrency={viewerCurrency} past={isTerminPast(item.event_date, item.event_time)} highlight={unreadTerminIds.has(item.id)} />}
          ListEmptyComponent={renderEmpty(tab.key)}
        />
      </View>
    );
  };

  const indicatorTranslate = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_W / 2],
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={styles.title}>Moji termini</Text>
      </View>

      <View style={styles.tabsWrap}>
        <View style={styles.tabsRow}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity key={tab.key} onPress={() => goToTab(idx)} style={styles.tabBtn} activeOpacity={0.7}>
              <Text style={[styles.tabLabel, activeIndex === idx && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.indicatorTrack}>
          <Animated.View style={[styles.indicator, { transform: [{ translateX: indicatorTranslate }] }]} />
        </View>
      </View>

      <FlatList
        ref={pagerRef}
        data={TABS}
        keyExtractor={(item) => item.key}
        renderItem={renderList}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
        initialScrollIndex={0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.6,
    marginBottom: 20,
  },
  tabsWrap: {
    marginBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabLabel: {
    color: colors.textSec,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },
  indicatorTrack: {
    height: 2,
    backgroundColor: colors.line,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W / 2,
    height: 2,
    backgroundColor: colors.logoGreen,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDesc: {
    color: colors.textSec,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.logoGreen,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: radius.xl,
  },
  emptyBtnText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
});
