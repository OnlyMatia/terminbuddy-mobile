import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { colors } from '../theme/colors';
import { ArrowLeftIcon, TrashIcon } from './Icons';

const MONTHS = ['Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj', 'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'];
const WEEKDAYS = ['pon', 'uto', 'sri', 'čet', 'pet', 'sub', 'ned'];
const SCREEN_H = Dimensions.get('window').height;

function formatDateLocal(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shortLabel(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${parseInt(d, 10)}.${parseInt(m, 10)}.`;
}

export function DateFilterModal({ visible, onClose, value, onApply }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120) {
          onClose();
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
    }),
  ).current;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minLimit = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 6, 1);
  const todayISO = formatDateLocal(today);

  const [start, setStart] = useState(value?.from || null);
  const [end, setEnd] = useState(value?.to && value.to !== value.from ? value.to : null);
  const [viewDate, setViewDate] = useState(() => {
    const base = value?.from ? new Date(value.from) : new Date(today);
    base.setDate(1);
    base.setHours(0, 0, 0, 0);
    return base;
  });

  useEffect(() => {
    if (visible) {
      setStart(value?.from || null);
      setEnd(value?.to && value.to !== value.from ? value.to : null);
      const base = value?.from ? new Date(value.from) : new Date(today);
      base.setDate(1);
      base.setHours(0, 0, 0, 0);
      setViewDate(base);
      dragY.setValue(0);
    }
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_H,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const generateDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }
    return days;
  };

  const handleMonthChange = (offset) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    if (next >= minLimit && next <= maxDate) setViewDate(next);
  };

  const atMin = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();
  const atMax = viewDate.getFullYear() === maxDate.getFullYear() && viewDate.getMonth() === maxDate.getMonth();

  const handleDayClick = (date) => {
    if (!date || date < today) return;
    const iso = formatDateLocal(date);

    if (!start || (start && end)) {
      setStart(iso);
      setEnd(null);
      onApply({ from: iso, to: iso });
    } else if (iso === start) {
      setStart(null);
      setEnd(null);
      onApply({ from: null, to: null });
    } else if (iso < start) {
      setEnd(start);
      setStart(iso);
      onApply({ from: iso, to: start });
    } else {
      setEnd(iso);
      onApply({ from: start, to: iso });
    }
  };

  const isStart = (iso) => start && iso === start;
  const isEnd = (iso) => end && iso === end;
  const inRange = (iso) => {
    if (start && end) return iso >= start && iso <= end;
    return start && iso === start;
  };

  const handleReset = () => {
    setStart(null);
    setEnd(null);
    onApply({ from: null, to: null });
  };

  const selectionLabel = start ? (end && end !== start ? `${shortLabel(start)} – ${shortLabel(end)}` : shortLabel(start)) : 'Nije odabrano';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </View>
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.panel, { transform: [{ translateY: Animated.add(slideAnim, dragY) }] }]}>
        <View {...panResponder.panHandlers}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Datum</Text>
            <TouchableOpacity onPress={handleReset} style={styles.resetRow}>
              <TrashIcon size={14} color="#f87171" />
              <Text style={styles.resetText}>Očisti</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.calendarCard}>
            <View style={styles.monthRow}>
              <TouchableOpacity onPress={() => handleMonthChange(-1)} disabled={atMin} style={{ opacity: atMin ? 0 : 1, transform: [{ rotate: '180deg' }] }}>
                <ArrowLeftIcon size={18} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => handleMonthChange(1)} disabled={atMax} style={{ opacity: atMax ? 0 : 1 }}>
                <ArrowLeftIcon size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((d) => (
                <Text key={d} style={styles.weekdayText}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {generateDays().map((date, i) => {
                if (!date) return <View key={i} style={styles.dayCell} />;
                const iso = formatDateLocal(date);
                const past = iso < todayISO;
                const endpoint = isStart(iso) || isEnd(iso);
                const middle = inRange(iso) && !endpoint;
                const isCurrent = iso === todayISO;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleDayClick(date)}
                    disabled={past}
                    style={[styles.dayCell, endpoint && { backgroundColor: colors.logoGreen }, middle && { backgroundColor: colors.greenSoft }, isCurrent && !endpoint && !middle && !past && { borderWidth: 1, borderColor: colors.logoGreen }]}
                  >
                    <Text style={[styles.dayText, past && { opacity: 0.3 }, endpoint && { color: '#000' }]}>{date.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.selectionRow}>
            <Text style={styles.selectionLabel}>Odabrano</Text>
            <Text style={styles.selectionValue}>{selectionLabel}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Gotovo</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    height: '100%',
    width: '100%',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  resetText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  calendarCard: {
    backgroundColor: colors.bg3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSec,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 16,
  },
  selectionLabel: {
    color: colors.textSec,
    fontSize: 13,
  },
  selectionValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 20,
  },
  doneBtn: {
    backgroundColor: colors.logoGreen,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});
