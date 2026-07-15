import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { citiesByCountry } from '../data/data';
import { colors } from '../theme/colors';

const SORT_OPTIONS = [
  { label: 'Najnovije', value: 'Najnoviji' },
  { label: 'Najstarije', value: 'Najstariji' },
];

const COUNTRIES = Object.keys(citiesByCountry);
const SCREEN_H = Dimensions.get('window').height;

export function FilterModal({ visible, onClose, filters, onApply, userCountry }) {
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

  const [country, setCountry] = useState(filters.country || '');
  const [selectedCities, setSelectedCities] = useState(filters.cities || []);
  const [sortBy, setSortBy] = useState(filters.sortBy || 'Najnoviji');

  const availableCities = country ? citiesByCountry[country] || [] : [];

  useEffect(() => {
    if (visible) {
      setCountry(filters.country || '');
      setSelectedCities(filters.cities || []);
      setSortBy(filters.sortBy || 'Najnoviji');
      dragY.setValue(0);
    }
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_H,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const toggleCity = (city) => {
    setSelectedCities((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));
  };

  const handleApply = () => {
    onApply({ country, cities: selectedCities, sortBy });
    onClose();
  };

  const handleReset = () => {
    setCountry('');
    setSelectedCities([]);
    setSortBy('Najnoviji');
  };

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
            <Text style={styles.headerTitle}>Filteri</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Očisti</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 20, gap: 24 }}>
          <View>
            <Text style={styles.sectionLabel}>Država</Text>
            <View style={styles.segmentRow}>
              {COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setCountry(country === c ? '' : c);
                    setSelectedCities([]);
                  }}
                  style={[styles.segment, country === c && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, country === c && { color: colors.text, fontWeight: '600' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {availableCities.length > 0 && (
            <View>
              <Text style={styles.sectionLabel}>Gradovi</Text>
              <View style={styles.chipsWrap}>
                {availableCities.map((c) => {
                  const isSelected = selectedCities.includes(c);
                  return (
                    <TouchableOpacity key={c} onPress={() => toggleCity(c)} style={[styles.cityChip, isSelected && styles.cityChipSelected]}>
                      <Text style={[styles.cityChipText, isSelected && { color: colors.logoGreen }]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View>
            <Text style={styles.sectionLabel}>Sortiraj</Text>
            <View style={styles.segmentRow}>
              {SORT_OPTIONS.map((o) => (
                <TouchableOpacity key={o.value} onPress={() => setSortBy(o.value)} style={[styles.segment, sortBy === o.value && styles.segmentActive]}>
                  <Text style={[styles.segmentText, sortBy === o.value && { color: colors.text, fontWeight: '600' }]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>Primijeni filtere</Text>
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
  sectionLabel: {
    color: colors.textSec,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 5,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  segmentText: {
    color: colors.textSec,
    fontSize: 13,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cityChipSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.logoGreen,
  },
  cityChipText: {
    color: colors.text,
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  applyBtn: {
    backgroundColor: colors.logoGreen,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});
