import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '../theme/colors';

function timeToDate(timeStr) {
  const d = new Date();
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h || 0, m || 0, 0, 0);
  }
  return d;
}

export default function CustomTimePicker({ value, onChange, step = 30 }) {
  const [showPicker, setShowPicker] = useState(false);
  const dateObj = timeToDate(value);

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      const hh = String(selectedDate.getHours()).padStart(2, '0');
      const mm = String(selectedDate.getMinutes()).padStart(2, '0');
      onChange(`${hh}:${mm}`);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setShowPicker(true)} activeOpacity={0.85}>
        <Text style={[styles.triggerText, value && { color: colors.logoGreen, fontWeight: '600' }]}>{value || '--:--'}</Text>
      </TouchableOpacity>

      {showPicker && Platform.OS === 'android' && <DateTimePicker value={dateObj} mode="time" display="default" is24Hour onChange={handleChange} />}

      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <DateTimePicker value={dateObj} mode="time" display="spinner" is24Hour minuteInterval={step} onChange={handleChange} textColor={colors.text} style={{ backgroundColor: colors.bg2 }} />
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
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  triggerText: {
    color: colors.textSec,
    fontSize: 18,
    letterSpacing: -0.5,
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
