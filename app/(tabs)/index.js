import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BLogo, FilterIcon } from '../../components/Icons';
import { colors, radius } from '../../theme/colors';

export default function Home() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <BLogo size={26} />
          <Text style={styles.brandText}>TerminBuddy</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <FilterIcon size={18} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Aktivni termini</Text>
      <Text style={styles.subtitle}>Ovdje će se prikazivati termini u tvojoj blizini.</Text>

      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Trenutno nema aktivnih termina.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 15,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    letterSpacing: -0.5,
    paddingHorizontal: 16,
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
