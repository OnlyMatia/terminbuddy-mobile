import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CloseIcon, SearchIcon } from '../../components/Icons';
import StepHeading from '../../components/StepHeading';
import { citiesByCountry } from '../../data/data';
import { colors, radius } from '../../theme/colors';

export default function StepCity({ form, set }) {
  const [citySearch, setCitySearch] = useState('');
  const [playgroundInput, setPlaygroundInput] = useState(form.playground || '');

  const availableCities = form.country ? citiesByCountry[form.country] || [] : [];
  const searchTrimmed = citySearch.trim();
  const playgroundTrimmed = playgroundInput.trim();

  const filteredCities = useMemo(() => {
    if (!searchTrimmed) return availableCities;
    return availableCities.filter((c) => c.toLowerCase().includes(searchTrimmed.toLowerCase()));
  }, [searchTrimmed, availableCities]);

  const isExactMatch = filteredCities.some((c) => c.toLowerCase() === searchTrimmed.toLowerCase());

  return (
    <>
      <StepHeading title="Gdje je termin?" desc="Odaberi državu i grad u kojem se igra." />

      <View style={styles.countryRow}>
        <TouchableOpacity
          onPress={() => {
            set('country', 'Hrvatska');
            set('city', '');
            set('playground', '');
            setCitySearch('');
          }}
          style={[styles.countryBtn, form.country === 'Hrvatska' && styles.countryBtnActive]}
        >
          <Text style={[styles.countryText, form.country === 'Hrvatska' && { color: colors.logoGreen }]}>Hrvatska</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            set('country', 'Bosna i Hercegovina');
            set('city', '');
            set('playground', '');
            setCitySearch('');
          }}
          style={[styles.countryBtn, form.country === 'Bosna i Hercegovina' && styles.countryBtnActive]}
        >
          <Text style={[styles.countryText, form.country === 'Bosna i Hercegovina' && { color: colors.logoGreen }]}>BiH</Text>
        </TouchableOpacity>
      </View>

      {form.country && !form.city && (
        <View>
          <View style={styles.searchBox}>
            <SearchIcon size={18} />
            <TextInput placeholder="Traži grad ili upiši vlastiti..." placeholderTextColor={colors.textFaint} maxLength={15} value={citySearch} onChangeText={setCitySearch} style={styles.searchInput} />
          </View>

          <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            <View style={styles.cityGrid}>
              {filteredCities.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    set('city', c);
                    setCitySearch('');
                  }}
                  style={styles.cityCard}
                >
                  <Text style={styles.cityCardText}>{c}</Text>
                </TouchableOpacity>
              ))}
              {searchTrimmed && !isExactMatch && (
                <TouchableOpacity
                  onPress={() => {
                    set('city', searchTrimmed);
                    setCitySearch('');
                  }}
                  style={styles.customCityCard}
                >
                  <Text style={styles.customCityText}>+ {searchTrimmed}</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {form.city && (
        <View>
          <View style={styles.confirmedRow}>
            <Text style={styles.confirmedText}>{form.city}</Text>
            <TouchableOpacity
              onPress={() => {
                set('city', '');
                set('playground', '');
                setPlaygroundInput('');
                setCitySearch('');
              }}
              style={styles.closeCircle}
            >
              <CloseIcon size={16} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subheading}>Lokacija igrališta</Text>
          <Text style={styles.subdesc}>
            Upiši naziv terena, dvorane ili adrese gdje se igra u gradu <Text style={{ color: colors.text, fontWeight: '500' }}>{form.city}</Text>.
          </Text>

          {!form.playground ? (
            <>
              <TextInput
                placeholder="Npr. SRC Trnje, Dvorana na Velesajmu..."
                placeholderTextColor={colors.textFaint}
                maxLength={30}
                value={playgroundInput}
                onChangeText={setPlaygroundInput}
                onBlur={() => playgroundTrimmed && set('playground', playgroundTrimmed)}
                onSubmitEditing={() => playgroundTrimmed && set('playground', playgroundTrimmed)}
                style={styles.playgroundInput}
              />
              {playgroundTrimmed && (
                <TouchableOpacity onPress={() => set('playground', playgroundTrimmed)} style={styles.confirmLocationBtn}>
                  <Text style={styles.customCityText}>+ Potvrdi lokaciju: {playgroundTrimmed}</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.confirmedRow}>
              <Text style={styles.confirmedText}>{form.playground}</Text>
              <TouchableOpacity
                onPress={() => {
                  set('playground', '');
                  setPlaygroundInput('');
                }}
                style={styles.closeCircle}
              >
                <CloseIcon size={16} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  countryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  countryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line2,
    alignItems: 'center',
  },
  countryBtnActive: {
    borderColor: colors.logoGreen,
    backgroundColor: colors.greenSoft,
  },
  countryText: {
    color: colors.textSec,
    fontSize: 14,
    fontWeight: '500',
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
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cityCard: {
    width: '47%',
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cityCardText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  customCityCard: {
    width: '100%',
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.logoGreen,
  },
  customCityText: {
    color: colors.logoGreen,
    fontSize: 14,
    fontWeight: '500',
  },
  confirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.borderColor,
    marginBottom: 28,
  },
  confirmedText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subheading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subdesc: {
    color: colors.textSec,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  playgroundInput: {
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  confirmLocationBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.logoGreen,
  },
});
