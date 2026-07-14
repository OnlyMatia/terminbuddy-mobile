import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlusIcon } from '../components/Icons';
import TerminCard from '../components/TerminCard';
import { useNotifications } from '../context/NotificationContext';
import { colors, radius } from '../theme/colors';

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

export default function MyTerminsScreen({ createdData, joinedData, viewerCurrency = 'EUR', loading, onRefresh, refreshing }) {
  const router = useRouter();
  const { unreadTerminIds } = useNotifications();
  const [activeTab, setActiveTab] = useState('created');

  const created = useMemo(() => sortActiveFirst(createdData || []), [createdData]);
  const joined = useMemo(() => sortActiveFirst(joinedData || []), [joinedData]);

  const activeList = activeTab === 'created' ? created : joined;

  const activeCreatedCount = created.filter((t) => !isTerminPast(t.event_date, t.event_time)).length;
  const activeJoinedCount = joined.filter((t) => !isTerminPast(t.event_date, t.event_time)).length;

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.logoGreen} />
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>{activeTab === 'created' ? 'Još nisi objavio nijedan termin.' : 'Još se nisi pridružio nijednom terminu.'}</Text>
        <Text style={styles.emptyDesc}>{activeTab === 'created' ? 'Objavi svoj prvi termin i skupi ekipu.' : 'Pronađi termin na početnoj i prijavi se.'}</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push(activeTab === 'created' ? '/(tabs)/post' : '/(tabs)')} activeOpacity={0.9}>
          {activeTab === 'created' && <PlusIcon size={16} color="#000" />}
          <Text style={styles.emptyBtnText}>{activeTab === 'created' ? 'Objavi termin' : 'Istraži termine'}</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, activeTab, router]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={loading ? [] : activeList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.logoGreen} colors={[colors.logoGreen]} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Moji termini</Text>

            <View style={styles.segmentRow}>
              <TouchableOpacity onPress={() => setActiveTab('created')} style={[styles.segment, activeTab === 'created' && styles.segmentActive]} activeOpacity={1}>
                <Text style={[styles.segmentText, activeTab === 'created' && styles.segmentTextActive]}>Organiziram</Text>
                <View style={[styles.countBadge, activeTab === 'created' && styles.countBadgeActive]}>
                  <Text style={[styles.countText, activeTab === 'created' && { color: '#000' }]}>{activeCreatedCount}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('joined')} style={[styles.segment, activeTab === 'joined' && styles.segmentActive]} activeOpacity={1}>
                <Text style={[styles.segmentText, activeTab === 'joined' && styles.segmentTextActive]}>Igram</Text>
                <View style={[styles.countBadge, activeTab === 'joined' && styles.countBadgeActive]}>
                  <Text style={[styles.countText, activeTab === 'joined' && { color: '#000' }]}>{activeJoinedCount}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => <TerminCard termin={item} viewerCurrency={viewerCurrency} past={isTerminPast(item.event_date, item.event_time)} highlight={unreadTerminIds.has(item.id)} />}
        ListEmptyComponent={renderEmpty}
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
    marginTop: 8,
    marginBottom: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 5,
    gap: 4,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  segmentActive: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  segmentText: {
    color: colors.textSec,
    fontSize: 13,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  countBadge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: colors.logoGreen,
  },
  countText: {
    color: colors.textSec,
    fontSize: 11,
    fontWeight: '700',
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
