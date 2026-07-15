import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getUnreadNotificationsCount, getUnreadNotificationTerminIds, getUserChatRooms, markNotificationsRead } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [hasTerminNotifs, setHasTerminNotifs] = useState(false);
  const [hasChatUnread, setHasChatUnread] = useState(false);
  const [unreadTerminIds, setUnreadTerminIds] = useState(() => new Set());
  const [roomIds, setRoomIds] = useState([]);
  const [lastMessageEvent, setLastMessageEvent] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setHasTerminNotifs(false);
      setHasChatUnread(false);
      setUnreadTerminIds(new Set());
      setRoomIds([]);
      return;
    }
    const [notifCount, terminIds, roomsRes] = await Promise.all([getUnreadNotificationsCount(), getUnreadNotificationTerminIds(), getUserChatRooms()]);
    setHasTerminNotifs(notifCount > 0);
    setUnreadTerminIds(new Set(terminIds));
    if (roomsRes.success) {
      setRoomIds(roomsRes.data.map((r) => r.id));
      const totalUnread = roomsRes.data.reduce((sum, r) => sum + (r.unreadCount || 0), 0);
      setHasChatUnread(totalUnread > 0);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        setHasTerminNotifs(true);
        const terminId = payload.new?.termin_id;
        if (terminId) setUnreadTerminIds((prev) => new Set(prev).add(terminId));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    if (!user || roomIds.length === 0) return;

    const channel = supabase
      .channel(`messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `termin_id=in.(${roomIds.join(',')})`,
        },
        (payload) => {
          const msg = payload.new;
          if (msg.sender_id === user.id) return;
          setHasChatUnread(true);
          setLastMessageEvent(msg);
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, roomIds.join(',')]);

  const clearTerminNotifs = useCallback(async () => {
    setHasTerminNotifs(false);
    await markNotificationsRead();
  }, []);

  const clearTerminNotifForId = useCallback((terminId) => {
    setUnreadTerminIds((prev) => {
      if (!prev.has(terminId)) return prev;
      const next = new Set(prev);
      next.delete(terminId);
      return next;
    });
  }, []);

  const clearChatUnread = useCallback(() => {
    setHasChatUnread(false);
  }, []);

  const registerRooms = useCallback((ids) => {
    setRoomIds((prev) => {
      const next = ids.join(',');
      return prev.join(',') === next ? prev : ids;
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        hasTerminNotifs,
        hasChatUnread,
        unreadTerminIds,
        lastMessageEvent,
        refresh,
        registerRooms,
        clearTerminNotifs,
        clearTerminNotifForId,
        clearChatUnread,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
