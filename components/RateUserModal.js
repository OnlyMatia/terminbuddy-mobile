import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { rateUser } from '../lib/api';
import { colors } from '../theme/colors';
import { CheckIcon, CloseIcon } from './Icons';

const RATING_OPTIONS = [
  { value: 5, label: 'Odlično iskustvo', desc: 'Sjajan suigrač, igrao bih opet' },
  { value: 4, label: 'Dobro iskustvo', desc: 'Ugodna i fer igra' },
  { value: 3, label: 'U redu', desc: 'Sve solidno, bez primjedbi' },
  { value: 2, label: 'Loše iskustvo', desc: 'Bilo je problema tokom igre' },
  { value: 1, label: 'Jako loše iskustvo', desc: 'Ne preporučujem' },
];

const SCREEN_H = Dimensions.get('window').height;

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase();
}

export default function RateUserModal({ visible, onClose, player, terminId, onRated, onError }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (visible) setSelected(null);
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_H,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!player) return null;

  const handleSubmit = () => {
    if (!selected) return;
    const targetId = player.id;
    const ratingValue = selected;
    onRated?.(targetId, ratingValue);
    onClose();
    rateUser(terminId, targetId, ratingValue).then((res) => {
      if (!res?.success) onError?.(targetId, res?.message || 'Greška pri ocjenjivanju.');
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ocjeni igrača</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <CloseIcon size={16} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.playerRow}>
            <View style={styles.avatarCircle}>{player.avatar_url ? <Image source={{ uri: player.avatar_url }} style={styles.avatarImg} /> : <Text style={styles.avatarInitials}>{getInitials(player.full_name || player.username)}</Text>}</View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.full_name || player.username}
              </Text>
              <Text style={styles.playerHandle}>@{player.username}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Kako je bilo iskustvo?</Text>

          <View style={{ gap: 6 }}>
            {RATING_OPTIONS.map((opt) => {
              const isSelected = selected === opt.value;
              return (
                <TouchableOpacity key={opt.value} onPress={() => setSelected(opt.value)} style={[styles.optionRow, isSelected && styles.optionRowSelected]}>
                  <View style={[styles.numberBox, isSelected && { backgroundColor: colors.logoGreen }]}>
                    <Text style={[styles.numberText, isSelected && { color: '#000' }]}>{opt.value}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </View>
                  {isSelected && <CheckIcon size={16} color={colors.logoGreen} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Odustani</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} disabled={!selected} style={[styles.rateBtn, !selected && { opacity: 0.5 }]}>
            <Text style={styles.rateBtnText}>Ocjeni</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    height: '100%',
    width: '100%',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '88%',
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textFaint,
    alignSelf: 'center',
    marginTop: 10,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.bg3,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  playerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  playerHandle: {
    color: colors.textSec,
    fontSize: 12,
  },
  sectionLabel: {
    color: colors.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionRowSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.logoGreen,
  },
  numberBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  optionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  optionDesc: {
    color: colors.textSec,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  rateBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
  },
  rateBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
});
