import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme/colors';

const ITEM_HEIGHT = 48;

function ClockIcon({ size = 20, color = colors.logoGreen }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 3" />
    </Svg>
  );
}

function buildTimes() {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return times;
}

function nearestUpcomingTime(times) {
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  if (m > 0 && m <= 30) {
    m = 30;
  } else if (m > 30) {
    m = 0;
    h = (h + 1) % 24;
  }
  const target = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return times.indexOf(target);
}

export default function CustomTimePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef(null);
  const times = useMemo(buildTimes, []);

  useEffect(() => {
    if (!isOpen) return;
    const index = value ? times.indexOf(value) : nearestUpcomingTime(times);
    if (index !== -1) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
      }, 10);
    }
  }, [isOpen, value, times]);

  return (
    <>
      <TouchableOpacity onPress={() => setIsOpen(true)} style={[styles.trigger, isOpen && { borderColor: colors.logoGreen }]} activeOpacity={0.85}>
        <Text style={[styles.triggerText, value && { color: colors.text }]}>{value || 'Odaberi vrijeme'}</Text>
        <ClockIcon size={20} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Odaberi vrijeme</Text>
          </View>
          <ScrollView ref={scrollRef} style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {times.map((t) => {
              const selected = value === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    onChange(t);
                    setIsOpen(false);
                  }}
                  style={[styles.timeRow, selected && { backgroundColor: colors.logoGreen }]}
                >
                  <Text style={[styles.timeText, selected && { color: '#000', fontWeight: '600' }]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
    height: 55,
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
    paddingBottom: 24,
    overflow: 'hidden',
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
  timeRow: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    paddingLeft: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
});
