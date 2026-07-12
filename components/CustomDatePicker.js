import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { colors } from '../theme/colors';
import { formatDisplayDate } from '../utils/utils';
import { ArrowLeftIcon, CalendarIcon } from './Icons';

const MONTHS = ['Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj', 'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'];
const WEEKDAYS = ['pon', 'uto', 'sri', 'čet', 'pet', 'sub', 'ned'];

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CustomDatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = formatDateLocal(today);
  const minLimit = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 6, 1);

  const [viewDate, setViewDate] = useState(() => {
    const base = value ? new Date(value) : new Date(today);
    base.setDate(1);
    base.setHours(0, 0, 0, 0);
    return base;
  });

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

  const handleOpen = () => {
    const base = value ? new Date(value) : new Date(today);
    base.setDate(1);
    base.setHours(0, 0, 0, 0);
    setViewDate(base);
    setIsOpen(true);
  };

  const handleDayClick = (date) => {
    if (!date) return;
    const iso = formatDateLocal(date);
    if (iso < todayISO) return;
    onChange(iso);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity onPress={handleOpen} style={[styles.trigger, isOpen && { borderColor: colors.logoGreen }]} activeOpacity={0.85}>
        <Text style={[styles.triggerText, value && { color: colors.text }]}>{value ? formatDisplayDate(value) : 'Odaberi datum'}</Text>
        <CalendarIcon size={20} color={colors.logoGreen} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Odaberi datum</Text>
          </View>

          <View style={styles.calendarCard}>
            <View style={styles.monthRow}>
              <TouchableOpacity onPress={() => handleMonthChange(-1)} disabled={atMin} style={{ opacity: atMin ? 0 : 1 }} hitSlop={10}>
                <ArrowLeftIcon size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => handleMonthChange(1)} disabled={atMax} style={{ opacity: atMax ? 0 : 1, transform: [{ rotate: '180deg' }] }} hitSlop={10}>
                <ArrowLeftIcon size={18} color={colors.text} />
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
                const selected = value === iso;
                const isToday = iso === todayISO;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleDayClick(date)}
                    disabled={past}
                    style={[styles.dayCell, selected && { backgroundColor: colors.logoGreen }, isToday && !selected && !past && { borderWidth: 1, borderColor: colors.logoGreen }]}
                  >
                    <Text style={[styles.dayText, past && { opacity: 0.25 }, selected && { color: '#000' }]}>{date.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  triggerText: {
    color: colors.textSec,
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  calendarCard: {
    marginHorizontal: 16,
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
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
