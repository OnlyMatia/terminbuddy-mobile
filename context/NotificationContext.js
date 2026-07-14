import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getUnreadNotificationsCount, getUnreadNotificationTerminIds, getUserChatRooms, markNotificationsRead } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [hasTerminNotifs, setHasTerminNotifs] = useState(false);
  const [hasChatUnread, setHasChatUnread] = useState(false);
  const [unreadTerminIds, setUnreadTerminIds] = useState(() => new Set());
  const myRoomIdsRef = useRef(new Set());

  const refresh = useCallback(async () => {
    if (!user) {
      setHasTerminNotifs(false);
      setHasChatUnread(false);
      setUnreadTerminIds(new Set());
      return;
    }
    const [notifCount, terminIds, roomsRes] = await Promise.all([getUnreadNotificationsCount(), getUnreadNotificationTerminIds(), getUserChatRooms()]);
    setHasTerminNotifs(notifCount > 0);
    setUnreadTerminIds(new Set(terminIds));
    if (roomsRes.success) {
      myRoomIdsRef.current = new Set(roomsRes.data.map((r) => r.id));
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
      .channel('global-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        setHasTerminNotifs(true);
        const terminId = payload.new?.termin_id;
        if (terminId) {
          setUnreadTerminIds((prev) => new Set(prev).add(terminId));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if (msg.sender_id === user.id) return;
        if (myRoomIdsRef.current.has(msg.termin_id)) setHasChatUnread(true);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

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

  return (
    <NotificationContext.Provider
      value={{
        hasTerminNotifs,
        hasChatUnread,
        unreadTerminIds,
        refresh,
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
