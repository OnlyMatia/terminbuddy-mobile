import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { colors, radius } from '../theme/colors';
import { CloseIcon } from './Icons';

const CURRENCIES = [
  { value: 'KM', label: 'BAM (KM)' },
  { value: 'EUR', label: 'EUR (€)' },
];

const SCREEN_H = Dimensions.get('window').height;

export default function SettingsModal({ visible, onClose, user, onEditProfile, onUpdateCurrency, onUpdateEmailNotifications, onDeleteAccount }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(false);
  const [currency, setCurrency] = useState(user?.currency || 'EUR');
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(user?.email_notifications !== false);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_H,
      duration: 300,
      useNativeDriver: true,
    }).start();
    if (!visible) {
      setTimeout(() => {
        setConfirmDelete(false);
        setEditingCurrency(false);
      }, 300);
    }
  }, [visible]);

  const handleCurrencySelect = async (value) => {
    if (value === currency) {
      setEditingCurrency(false);
      return;
    }
    setSavingCurrency(true);
    const res = await onUpdateCurrency?.(value);
    if (res?.success !== false) setCurrency(value);
    setSavingCurrency(false);
    setEditingCurrency(false);
  };

  const handleEmailToggle = async () => {
    if (savingEmail) return;
    const newValue = !emailNotifs;
    setEmailNotifs(newValue);
    setSavingEmail(true);
    const res = await onUpdateEmailNotifications?.(newValue);
    if (res?.success === false) setEmailNotifs(!newValue);
    setSavingEmail(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await onDeleteAccount?.();
    if (result?.success) {
      onClose();
      router.replace('/login');
    } else {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const rawCountry = user?.country || user?.settings?.country || 'BA';
  const displayCountry = rawCountry === 'BA' ? 'BiH' : rawCountry === 'HR' ? 'Hrvatska' : rawCountry;
  const displayCurrency = CURRENCIES.find((c) => c.value === currency)?.label || currency;
  const isDark = theme === 'dark';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Postavke</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <CloseIcon size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <TouchableOpacity style={styles.editBtn} onPress={onEditProfile} activeOpacity={0.85}>
            <Text style={styles.editBtnText}>Uredi profil</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Država</Text>
              <Text style={styles.rowValue}>{displayCountry}</Text>
            </View>

            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Valuta</Text>
              {editingCurrency ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => handleCurrencySelect(c.value)}
                      disabled={savingCurrency}
                      style={[
                        styles.currencyChip,
                        {
                          backgroundColor: currency === c.value ? colors.logoGreen : colors.bg2,
                          borderColor: currency === c.value ? colors.logoGreen : colors.line,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: currency === c.value ? '#000' : colors.textSec,
                        }}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TouchableOpacity onPress={() => setEditingCurrency(true)}>
                  <Text style={styles.rowValue}>{displayCurrency}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Tema</Text>
              <TouchableOpacity onPress={toggleTheme} style={[styles.toggleTrack, { backgroundColor: isDark ? colors.logoGreen : colors.line }]}>
                <View style={[styles.toggleThumb, { transform: [{ translateX: isDark ? 18 : 0 }] }]}>
                  <Text style={{ fontSize: 12 }}>{isDark ? '🌙' : '☀️'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Email obavijesti</Text>
              <TouchableOpacity onPress={handleEmailToggle} disabled={savingEmail} style={[styles.toggleTrack, { backgroundColor: emailNotifs ? colors.logoGreen : colors.line }]}>
                <View style={[styles.toggleThumb, { transform: [{ translateX: emailNotifs ? 18 : 0 }] }]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            {!confirmDelete ? (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => setConfirmDelete(true)}>
                <Text style={styles.deleteBtnText}>Izbriši profil</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ padding: 20, gap: 16 }}>
                <Text style={styles.confirmText}>Jesi li siguran? Sve se trajno briše.</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmDelete(false)}>
                    <Text style={styles.cancelBtnText}>Odustani</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmDeleteBtn} onPress={handleDelete} disabled={deleting}>
                    {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmDeleteBtnText}>Izbriši</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85%',
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 24,
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
    justifyContent: 'center',
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
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 16,
    gap: 20,
  },
  editBtn: {
    backgroundColor: colors.logoGreen,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.bg3,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 15,
  },
  rowValue: {
    color: colors.textSec,
    fontSize: 15,
  },
  currencyChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#f87171',
    fontSize: 15,
  },
  confirmText: {
    color: colors.textSec,
    fontSize: 14,
    textAlign: 'center',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.text,
    fontWeight: '500',
    fontSize: 14,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  confirmDeleteBtnText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
});
