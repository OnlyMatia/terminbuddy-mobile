import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/colors';

export function StatCard({ value, label }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function StatsRow({ stats }) {
  return (
    <View style={styles.row}>
      {stats.map((s) => (
        <StatCard key={s.title} value={s.value} label={s.title} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: 76,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.logoGreen,
    fontSize: 22,
    letterSpacing: -0.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  label: {
    color: colors.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
