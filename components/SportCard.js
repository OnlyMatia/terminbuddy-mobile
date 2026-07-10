import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/colors';

export default function SportCard({ sport }) {
  const { icon, name, sub, wins, losses, skill } = sport;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        </View>
        <Text style={styles.record}>
          <Text style={{ color: colors.logoGreen }}>{wins}W</Text>
          <Text style={{ color: colors.borderColor }}> / </Text>
          <Text style={{ color: '#f87171' }}>{losses}L</Text>
        </Text>
      </View>

      <View style={styles.barsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <View key={n} style={styles.barTrack}>
            <View style={[styles.barFill, { width: n <= skill ? '100%' : '0%' }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg3,
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sub: {
    color: colors.textSec,
    fontSize: 11,
    marginTop: 1,
  },
  record: {
    fontSize: 12,
    fontWeight: '500',
  },
  barsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  barTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.bg2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.logoGreen,
  },
});
