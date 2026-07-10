import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '../theme/colors';
import { formatDisplayDate } from '../utils/utils';
import { CalendarIcon } from './Icons';

export default function CustomDatePicker({ value, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const dateObj = value ? new Date(value) : new Date();

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      const iso = selectedDate.toISOString().split('T')[0];
      onChange(iso);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setShowPicker(true)} activeOpacity={0.85}>
        <CalendarIcon size={18} color={value ? colors.logoGreen : colors.textSec} />
        <Text style={[styles.triggerText, value && { color: colors.text }]}>{value ? formatDisplayDate(value) : 'Odaberi datum'}</Text>
      </TouchableOpacity>

      {showPicker && Platform.OS === 'android' && <DateTimePicker value={dateObj} mode="date" display="default" minimumDate={new Date()} onChange={handleChange} />}

      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <DateTimePicker value={dateObj} mode="date" display="spinner" minimumDate={new Date()} onChange={handleChange} textColor={colors.text} style={{ backgroundColor: colors.bg2 }} />
              <TouchableOpacity style={styles.doneBtn} onPress={() => setShowPicker(false)}>
                <Text style={styles.doneBtnText}>Gotovo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  triggerText: {
    color: colors.textSec,
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  doneBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.logoGreen,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
});
