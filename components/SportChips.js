import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

export function SportChips({ chips, selected, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((s) => {
        const isSelected = selected === s.name;
        return (
          <TouchableOpacity key={s.name} onPress={() => onSelect(s.name)} style={[styles.chip, isSelected && styles.chipSelected]} activeOpacity={0.85}>
            <Text style={styles.chipIcon}>{s.icon}</Text>
            <Text style={[styles.chipText, isSelected && { color: '#000', fontWeight: '600' }]}>{s.name}</Text>
            <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
              <Text style={[styles.countText, isSelected && { color: 'rgba(0,0,0,0.7)' }]}>{s.count}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  chipSelected: {
    backgroundColor: colors.logoGreen,
    borderColor: colors.logoGreen,
  },
  chipIcon: {
    fontSize: 12,
  },
  chipText: {
    color: colors.text,
    fontSize: 12,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  countText: {
    color: colors.textSec,
    fontSize: 10,
  },
});
