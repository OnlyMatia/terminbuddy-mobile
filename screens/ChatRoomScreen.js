import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackIcon, SendIcon } from '../components/Icons';
import { getSportIcon } from '../data/data';
import { getChatMessages, getTerminDetails, markChatRead, sendChatMessage } from '../lib/api';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase();
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
}

function sameMinute(a, b) {
  if (!a || !b) return false;
  return formatTime(a) === formatTime(b);
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Danas';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Jučer';
  return d.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long' });
}

export default function ChatRoomScreen({ terminId }) {
  const router = useRouter();
  const listRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [termin, setTermin] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (mounted) setCurrentUserId(user?.id || null);

      const [msgRes, terminRes] = await Promise.all([getChatMessages(terminId), getTerminDetails(terminId)]);

      if (!mounted) return;
      if (msgRes.success) setMessages(msgRes.data);
      if (terminRes.success) setTermin(terminRes.data);
      setLoading(false);
      markChatRead(terminId);
    })();

    const channel = supabase
      .channel(`chat-${terminId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `termin_id=eq.${terminId}` }, async (payload) => {
        const newMsg = payload.new;
        const { data: prof } = await supabase.from('profiles').select('username, avatar_url').eq('id', newMsg.sender_id).single();
        if (!mounted) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, profiles: prof }];
        });
        markChatRead(terminId);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [terminId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput('');

    const result = await sendChatMessage(terminId, content);
    if (result.success && result.data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === result.data.id)) return prev;
        return [...prev, result.data];
      });
    } else {
      setInput(content);
    }
    setSending(false);
  }, [input, sending, terminId]);

  const renderMessage = ({ item, index }) => {
    const isMine = item.sender_id === currentUserId;
    const prev = messages[index - 1];
    const next = messages[index + 1];
    const showDay = !prev || formatDayLabel(prev.created_at) !== formatDayLabel(item.created_at);
    const nextShowDay = next && formatDayLabel(item.created_at) !== formatDayLabel(next.created_at);
    const isNewSenderRun = !prev || prev.sender_id !== item.sender_id || showDay;
    const isLastInRun = !next || next.sender_id !== item.sender_id || nextShowDay;
    const showSender = !isMine && isNewSenderRun;

    const bubbleCornerStyle = isMine ? { borderBottomRightRadius: 6 } : isNewSenderRun ? { borderBottomLeftRadius: 6 } : null;

    const showTime = !next || next.sender_id !== item.sender_id || nextShowDay || !sameMinute(item.created_at, next.created_at);

    return (
      <View>
        {showDay && (
          <View style={styles.dayRow}>
            <Text style={styles.dayText}>{formatDayLabel(item.created_at)}</Text>
          </View>
        )}
        <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowTheirs, { marginBottom: isLastInRun ? 12 : 2 }]}>
          {!isMine && (
            <View style={styles.avatarColumn}>
              {showSender && (
                <View style={styles.msgAvatar}>{item.profiles?.avatar_url ? <Image source={{ uri: item.profiles.avatar_url }} style={styles.msgAvatarImg} /> : <Text style={styles.msgAvatarText}>{getInitials(item.profiles?.username)}</Text>}</View>
              )}
            </View>
          )}
          <View style={{ maxWidth: '78%' }}>
            {showSender && <Text style={styles.senderName}>{item.profiles?.username || 'Korisnik'}</Text>}
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, bubbleCornerStyle]}>
              <Text style={[styles.msgText, isMine && { color: '#000' }]}>{item.content}</Text>
            </View>
            {showTime && <Text style={[styles.msgTime, isMine && { textAlign: 'right' }]}>{formatTime(item.created_at)}</Text>}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <BackIcon size={18} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} onPress={() => router.push(`/termin/${terminId}`)} activeOpacity={0.8}>
          <View style={styles.headerIconBox}>
            <Text style={{ fontSize: 18 }}>{termin ? getSportIcon(termin?.sport) : '💬'}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {termin?.title || termin?.playground || 'Chat'}
            </Text>
            {termin && (
              <Text style={styles.headerSub} numberOfLines={1}>
                {termin.sport} · {termin.city}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.logoGreen} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>💬</Text>
                <Text style={styles.emptyText}>Nema poruka. Budi prvi!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput value={input} onChangeText={setInput} placeholder="Napiši poruku..." placeholderTextColor={colors.textFaint} style={styles.input} multiline maxLength={500} />
          <TouchableOpacity onPress={handleSend} disabled={!input.trim() || sending} style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}>
            <SendIcon size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  headerSub: {
    color: colors.textSec,
    fontSize: 11,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSec,
    fontSize: 14,
  },
  dayRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dayText: {
    color: colors.textSec,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: colors.bg2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  msgRowMine: {
    justifyContent: 'flex-end',
  },
  msgRowTheirs: {
    justifyContent: 'flex-start',
  },
  avatarColumn: {
    width: 40,
    alignItems: 'center',
  },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  msgAvatarImg: {
    width: '100%',
    height: '100%',
  },
  msgAvatarText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  senderName: {
    color: colors.logoGreen,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexShrink: 1,
  },
  bubbleMine: {
    backgroundColor: colors.logoGreen,
    borderRadius: 15,
  },
  bubbleTheirs: {
    backgroundColor: colors.bg3,
    borderRadius: 15,
  },
  msgText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  msgTime: {
    color: colors.textFaint,
    fontSize: 11,
    marginTop: 3,
    marginHorizontal: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    borderRadius: 22,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
