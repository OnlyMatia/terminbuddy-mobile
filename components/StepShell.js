import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function StepShell({ num, total, title, help, required, children }) {
  return (
    <View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          Korak <Text style={{ color: colors.logoGreen, fontWeight: '600' }}>{num}</Text>
          <Text style={{ color: colors.textFaint }}> / {String(total).padStart(2, '0')}</Text>
          {required && <Text style={{ color: colors.danger }}> • obavezno</Text>}
        </Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.help}>{help}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line2,
    marginBottom: 24,
  },
  badgeText: {
    color: colors.textSec,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 10,
  },
  help: {
    color: colors.textSec,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
});
