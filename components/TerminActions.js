import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { cancelRequestToJoin, deleteTermin, leaveJoinedTermin, sendRequestToJoin } from '../lib/api';
import { colors, radius } from '../theme/colors';

export default function TerminActions({ isOwner, isRegistered, hasPendingRequest, terminId, isAutoApprove, isFull, isExpired }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAction = async (actionFn, autoApproveOverride = isAutoApprove) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await actionFn(terminId, isOwner ? true : autoApproveOverride);
      if (res?.success) router.replace(`/termin/${terminId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    Alert.alert('Brisanje termina', 'Jeste li sigurni da želite trajno obrisati ovaj termin? Ova akcija je nepovratna.', [
      { text: 'Odustani', style: 'cancel' },
      {
        text: 'Izbriši',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteTermin(terminId);
          if (res.success) router.back();
        },
      },
    ]);
  };

  if (isExpired) {
    return (
      <View style={styles.disabledBox}>
        <Text style={styles.disabledText}>Termin je završen</Text>
      </View>
    );
  }

  if (isOwner) {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {isRegistered ? (
          <TouchableOpacity disabled={loading} onPress={() => handleAction(leaveJoinedTermin)} style={[styles.btn, styles.btnMuted, { flex: 1 }]}>
            <Text style={styles.btnMutedText}>{loading ? 'Odjavljivanje...' : 'Odustani'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity disabled={loading || isFull} onPress={() => handleAction(sendRequestToJoin, true)} style={[styles.btn, styles.btnPrimary, { flex: 1 }, (loading || isFull) && { opacity: 0.5 }]}>
            {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.btnPrimaryText}>{isFull ? 'Popunjeno' : 'Prijavi se'}</Text>}
          </TouchableOpacity>
        )}
        <TouchableOpacity disabled={loading} onPress={handleDeleteClick} style={[styles.btn, styles.btnDanger]}>
          <Text style={styles.btnDangerText}>Izbriši</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (isRegistered) {
    return (
      <TouchableOpacity disabled={loading} onPress={() => handleAction(leaveJoinedTermin)} style={[styles.btn, styles.btnMuted]}>
        <Text style={styles.btnMutedText}>{loading ? 'Odjavljivanje...' : 'Odustani od termina'}</Text>
      </TouchableOpacity>
    );
  }

  if (hasPendingRequest) {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={[styles.disabledBox, { flex: 1 }]}>
          <Text style={styles.disabledText}>Zahtjev poslan</Text>
        </View>
        <TouchableOpacity disabled={loading} onPress={() => handleAction(cancelRequestToJoin)} style={[styles.btn, styles.btnDanger]}>
          <Text style={styles.btnDangerText}>{loading ? 'Otkazivanje...' : 'Otkaži'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isFull) {
    return (
      <View style={styles.disabledBox}>
        <Text style={styles.disabledText}>Termin je popunjen</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity disabled={loading} onPress={() => handleAction(sendRequestToJoin)} style={[styles.btn, styles.btnPrimary, loading && { opacity: 0.5 }]}>
      {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.btnPrimaryText}>Prijavi se</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.logoGreen,
  },
  btnPrimaryText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 11,
  },
  btnMuted: {
    backgroundColor: colors.bg2,
  },
  btnMutedText: {
    color: '#f87171',
    fontWeight: '600',
    fontSize: 11,
  },
  btnDanger: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  btnDangerText: {
    color: '#f87171',
    fontWeight: '600',
    fontSize: 11,
  },
  disabledBox: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledText: {
    color: colors.textSec,
    fontSize: 11,
    fontWeight: '500',
  },
});
