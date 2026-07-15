import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
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
    h += 1;
  }
  if (h > 23) return -1;
  const target = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return times.indexOf(target);
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isTimeInPast(timeStr) {
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const slot = new Date();
  slot.setHours(h, m, 0, 0);
  return slot < now;
}

export default function CustomTimePicker({ value, onChange, date }) {
  const [isOpen, setIsOpen] = useState(false);
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
          setIsOpen(false);
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
    }),
  ).current;
  const scrollRef = useRef(null);
  const times = useMemo(buildTimes, []);
  const isToday = date === todayISO();

  useEffect(() => {
    if (!isOpen) return;
    dragY.setValue(0);
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

      <Modal visible={isOpen} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setIsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: dragY }] }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Odaberi vrijeme</Text>
            </View>
          </View>
          {isToday && times.every((t) => isTimeInPast(t)) && (
            <View style={styles.noSlotsBox}>
              <Text style={styles.noSlotsText}>Nema više dostupnih termina danas. Odaberi drugi datum.</Text>
            </View>
          )}
          <ScrollView ref={scrollRef} style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {times.map((t) => {
              const selected = value === t;
              const disabled = isToday && isTimeInPast(t);
              return (
                <TouchableOpacity
                  key={t}
                  disabled={disabled}
                  onPress={() => {
                    onChange(t);
                    setIsOpen(false);
                  }}
                  style={[styles.timeRow, selected && { backgroundColor: colors.logoGreen }, disabled && { opacity: 0.3 }]}
                >
                  <Text style={[styles.timeText, selected && { color: '#000', fontWeight: '600' }]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
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
    height: '100%',
    width: '100%',
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
  handle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textFaint,
    alignSelf: 'center',
    marginTop: 10,
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
  noSlotsBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,74,92,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,74,92,0.2)',
  },
  noSlotsText: {
    color: '#ff4a5c',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
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
