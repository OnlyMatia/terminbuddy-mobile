import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowLeftIcon, SearchIcon } from '../../components/Icons';
import StepHeading from '../../components/StepHeading';
import { ALL_SPORTS, SPORT_DATA } from '../../data/data';
import { colors, radius } from '../../theme/colors';

export default function StepSport({ form, set, showAllSports, setShowAllSports, sportSearch, setSportSearch }) {
  const allSportNames = ALL_SPORTS.map((s) => s.name);
  const isCustom = form.sport.trim() && !allSportNames.includes(form.sport);
  const searchTrimmed = sportSearch.trim();

  const filteredAllSports = useMemo(() => {
    if (!searchTrimmed) return ALL_SPORTS;
    return ALL_SPORTS.filter((s) => s.name.toLowerCase().includes(searchTrimmed.toLowerCase()));
  }, [searchTrimmed]);

  const isExactMatch = filteredAllSports.some((s) => s.name.toLowerCase() === searchTrimmed.toLowerCase());

  return (
    <>
      <StepHeading title="Koji sport?" desc="Odaberi šta igraš. Termin ćemo poslati pravim igračima u tvojoj blizini." />

      {!showAllSports ? (
        <View style={styles.grid}>
          {SPORT_DATA.map((s) => {
            const selected = form.sport === s.name;
            return (
              <TouchableOpacity key={s.name} onPress={() => set('sport', s.name)} style={[styles.sportCard, selected && styles.sportCardSelected]} activeOpacity={0.85}>
                <Text style={styles.sportIcon}>{s.icon}</Text>
                <Text style={[styles.sportName, selected && { color: '#000' }]}>{s.name}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={() => setShowAllSports(true)} style={styles.sportCard} activeOpacity={0.85}>
            <Text style={styles.sportIcon}>+</Text>
            <Text style={styles.sportName}>Ostalo</Text>
            <Text style={styles.sportCount}>{ALL_SPORTS.length} sportova</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={styles.searchBox}>
            <SearchIcon size={18} />
            <TextInput placeholder="Traži sport ili upiši vlastiti..." placeholderTextColor={colors.textFaint} value={sportSearch} onChangeText={setSportSearch} style={styles.searchInput} autoFocus />
          </View>

          <TouchableOpacity
            onPress={() => {
              setShowAllSports(false);
              setSportSearch('');
            }}
            style={styles.backRow}
          >
            <ArrowLeftIcon size={18} />
            <Text style={styles.backText}>Natrag</Text>
          </TouchableOpacity>

          <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            <View style={styles.gridSmall}>
              {filteredAllSports.map((s) => {
                const selected = form.sport === s.name;
                return (
                  <TouchableOpacity key={s.name} onPress={() => set('sport', s.name)} style={[styles.chipSport, selected && styles.chipSportSelected]}>
                    <Text style={{ fontSize: 16 }}>{s.icon} </Text>
                    <Text style={[styles.chipSportText, selected && { color: '#000' }]}>{s.name}</Text>
                  </TouchableOpacity>
                );
              })}
              {searchTrimmed && !isExactMatch && (
                <TouchableOpacity
                  onPress={() => {
                    set('sport', searchTrimmed);
                    setSportSearch('');
                  }}
                  style={styles.customChip}
                >
                  <Text style={styles.customChipText}>+ {searchTrimmed}</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {isCustom && (
        <Text style={styles.customLabel}>
          Vlastiti sport: <Text style={{ color: colors.logoGreen, fontWeight: '600' }}>{form.sport}</Text>
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportCard: {
    width: '47%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sportCardSelected: {
    backgroundColor: colors.logoGreen,
    borderColor: colors.logoGreen,
  },
  sportIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  sportName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  sportCount: {
    color: colors.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: {
    color: colors.textSec,
    fontSize: 13,
  },
  gridSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipSport: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipSportSelected: {
    backgroundColor: colors.logoGreen,
    borderColor: colors.logoGreen,
  },
  chipSportText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  customChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.logoGreen,
    backgroundColor: colors.bg2,
  },
  customChipText: {
    color: colors.logoGreen,
    fontSize: 13,
    fontWeight: '500',
  },
  customLabel: {
    color: colors.textSec,
    fontSize: 12,
    marginTop: 16,
  },
});
