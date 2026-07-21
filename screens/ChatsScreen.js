import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircleIcon } from '../components/Icons';
import { useNotifications } from '../context/NotificationContext';
import { getSportIcon } from '../data/data';
import { getUserChatRooms } from '../lib/api';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Jučer';
  return d.toLocaleDateString('hr-HR', { day: 'numeric', month: 'numeric' });
}

export default function ChatsScreen() {
  const router = useRouter();
  const { clearChatUnread, lastMessageEvent, registerRooms } = useNotifications();
  const [rooms, setRooms] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async ({ silent = false, pull = false } = {}) => {
      if (pull) setRefreshing(true);
      const result = await getUserChatRooms();
      if (result.success) {
        setRooms(result.data);
        setCurrentUserId(result.userId);
        registerRooms(result.data.map((r) => r.id));
      }
      setLoading(false);
      setRefreshing(false);
    },
    [registerRooms],
  );

  const initialLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      load({ silent: initialLoadedRef.current });
      initialLoadedRef.current = true;
      clearChatUnread();
    }, [load, clearChatUnread]),
  );

  const handledMsgRef = useRef(null);

  useEffect(() => {
    if (!lastMessageEvent || !currentUserId) return;
    if (handledMsgRef.current === lastMessageEvent.id) return;
    handledMsgRef.current = lastMessageEvent.id;

    const msg = lastMessageEvent;

    setRooms((prev) => {
      const idx = prev.findIndex((r) => r.id === msg.termin_id);
      if (idx === -1) return prev;

      const room = prev[idx];
      const updated = {
        ...room,
        lastMessage: { ...msg, profiles: room.lastMessage?.profiles },
        unreadCount: (room.unreadCount || 0) + 1,
      };

      const rest = prev.filter((_, i) => i !== idx);
      return [updated, ...rest];
    });

    supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', msg.sender_id)
      .single()
      .then(({ data: prof }) => {
        if (!prof) return;
        setRooms((prev) => prev.map((r) => (r.id === msg.termin_id && r.lastMessage?.id === msg.id ? { ...r, lastMessage: { ...r.lastMessage, profiles: prof } } : r)));
      });
  }, [lastMessageEvent, currentUserId]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={loading ? [] : rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 40, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ pull: true })} tintColor={colors.logoGreen} colors={[colors.logoGreen]} />}
        ListHeaderComponent={<Text style={styles.title}>Poruke</Text>}
        renderItem={({ item }) => {
          const lastMsg = item.lastMessage;
          const isMine = lastMsg?.sender_id === currentUserId;
          const preview = lastMsg ? `${isMine ? 'Ti: ' : lastMsg.profiles?.username ? lastMsg.profiles.username + ': ' : ''}${lastMsg.content}` : 'Nema poruka. Budi prvi!';
          const hasUnread = item.unreadCount > 0;

          return (
            <TouchableOpacity style={styles.roomRow} onPress={() => router.push(`/chat/${item.id}`)} activeOpacity={0.8}>
              <View style={styles.iconBox}>
                <Text style={{ fontSize: 22 }}>{getSportIcon(item.sport)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.roomTopRow}>
                  <Text style={[styles.roomTitle, hasUnread && { fontWeight: '700' }]} numberOfLines={1}>
                    {item.title || item.playground}
                  </Text>
                  {lastMsg && <Text style={[styles.roomTime, hasUnread && { color: colors.logoGreen }]}>{formatMessageTime(lastMsg.created_at)}</Text>}
                </View>
                <View style={styles.roomBottomRow}>
                  <Text style={[styles.roomPreview, hasUnread && { color: colors.text, fontWeight: '500' }]} numberOfLines={1}>
                    {preview}
                  </Text>
                  {hasUnread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.logoGreen} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MessageCircleIcon size={28} color={colors.textSec} />
              </View>
              <Text style={styles.emptyTitle}>Još nemaš razgovora.</Text>
              <Text style={styles.emptyDesc}>Pridruži se terminu ili objavi svoj i razgovaraj s ekipom.</Text>
            </View>
          )
        }
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
    marginBottom: 16,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.bg3,
    marginBottom: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  roomTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  roomTime: {
    color: colors.textSec,
    fontSize: 11,
  },
  roomBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  roomPreview: {
    color: colors.textSec,
    fontSize: 13,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
  },
  unreadText: {
    color: '#000',
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
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDesc: {
    color: colors.textSec,
    fontSize: 14,
    textAlign: 'center',
  },
});
