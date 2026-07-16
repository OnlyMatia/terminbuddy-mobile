import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function MatchRow({ match, isLast }) {
  const isWin = match.result === 'W';
  const score1Wins = match.score1 > match.score2;

  return (
    <View style={[styles.row, !isLast && styles.borderBottom]}>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {match.title}
          </Text>
          <View style={[styles.resultBadge, { backgroundColor: isWin ? colors.greenSoft : 'rgba(248,113,113,0.1)' }]}>
            <Text
              style={{
                color: isWin ? colors.logoGreen : '#f87171',
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
              }}
            >
              {match.result}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>{match.meta}</Text>
      </View>

      <Text style={styles.score}>
        <Text style={{ color: score1Wins ? colors.logoGreen : colors.text }}>{match.score1}</Text>
        <Text style={{ color: colors.textFaint, fontSize: 13 }}> – </Text>
        <Text style={{ color: !score1Wins ? colors.logoGreen : colors.text }}>{match.score2}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  resultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  meta: {
    color: colors.textSec,
    fontSize: 11,
  },
  score: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
});
