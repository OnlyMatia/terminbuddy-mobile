import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme/colors';

export default function MyTermins() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Moji termini</Text>
      <Text style={styles.subtitle}>Termini na koje si se prijavio ili koje si objavio.</Text>

      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Još se nisi prijavio ni na jedan termin.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    letterSpacing: -0.5,
    paddingHorizontal: 16,
    paddingTop: 20,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSec,
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  emptyState: {
    marginHorizontal: 16,
    paddingVertical: 40,
    borderRadius: radius.xl,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSec,
    fontSize: 14,
  },
});
