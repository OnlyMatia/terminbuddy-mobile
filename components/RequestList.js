import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { approveJoinRequest, rejectJoinRequest } from '../lib/api';
import { colors } from '../theme/colors';
import { UserIcon } from './Icons';

export default function RequestList({ requests, terminId, onUpdated }) {
  const [processing, setProcessing] = useState(null);
  const [localRequests, setLocalRequests] = useState(requests);

  const handleAction = async (requestId, actionFn) => {
    setProcessing(requestId);
    const res = await actionFn();
    if (res?.success) {
      setLocalRequests((prev) => prev.filter((r) => r.id !== requestId));
      onUpdated?.();
    }
    setProcessing(null);
  };

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.title}>Zahtjevi na čekanju</Text>
      <View style={{ gap: 10 }}>
        {localRequests.map((req) => (
          <View key={req.id} style={styles.row}>
            <View style={styles.userRow}>
              <View style={styles.avatarCircle}>{req.profiles?.avatar_url ? <Image source={{ uri: req.profiles.avatar_url }} style={styles.avatarImg} /> : <UserIcon size={18} color="rgba(0,0,0,0.4)" />}</View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.username} numberOfLines={1}>
                  {req.profiles?.username || 'Korisnik'}
                </Text>
                <Text style={styles.handle} numberOfLines={1}>
                  @{req.profiles?.username}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity disabled={processing === req.id} onPress={() => handleAction(req.id, () => rejectJoinRequest(req.id))} style={styles.rejectBtn}>
                <Text style={styles.rejectText}>Odbij</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={processing === req.id} onPress={() => handleAction(req.id, () => approveJoinRequest(req.id, terminId, req.user_id))} style={styles.approveBtn}>
                <Text style={styles.approveText}>Prihvati</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  row: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  username: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  handle: {
    color: colors.textSec,
    fontSize: 11,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectText: {
    color: colors.textSec,
    fontSize: 13,
    fontWeight: '500',
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
  },
  approveText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
});
