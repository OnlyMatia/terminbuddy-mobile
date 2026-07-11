import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BLogo, SearchIcon, UserIcon } from '../components/Icons';
import StepShell from '../components/StepShell';
import { Toast } from '../components/Toast';
import WheelColumn from '../components/WheelColumn';
import { citiesByCountry, SPORT_ICONS, sports } from '../data/data';
import { colors, radius } from '../theme/colors';

const SPORT_OPTIONS = sports.filter((s) => s !== 'Svi sportovi');

const LEVELS = [
  { id: 'beginner', name: 'Početnik', desc: 'Učim igru. Otvoren i strpljiv.' },
  { id: 'intermediate', name: 'Rekreativac', desc: 'Osnove su mi jasne. Casual ali ozbiljne igre.' },
  { id: 'advanced', name: 'Napredni', desc: 'Jaki temelji. Kompetitivan pristup.' },
  { id: 'professional', name: 'Profesionalac', desc: 'Igram na visokoj razini.' },
];

const MONTHS = ['Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj', 'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'];

const ALL_STEPS = ['identity', 'username', 'avatar', 'bio', 'birthdate', 'city', 'sports', 'level'];
const EDIT_STEPS = ['identity', 'avatar', 'bio', 'city', 'sports', 'level'];

const MIN_AGE = 10;
const MAX_AGE = 100;

function levelToSkill(level) {
  switch (level) {
    case 'beginner':
      return 1;
    case 'amateur':
      return 2;
    case 'intermediate':
      return 3;
    case 'advanced':
      return 4;
    case 'professional':
      return 5;
    default:
      return 3;
  }
}

function daysInMonth(month, year) {
  if (!month) return 31;
  return new Date(year || 2000, month, 0).getDate();
}

function calcAge(year, month, day) {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1;
  if (m < month || (m === month && today.getDate() < day)) age--;
  return age;
}

export default function OnboardingScreen({ user, editMode = false, onFinish, onEditFinish, onUploadAvatar, onClose }) {
  const STEPS = editMode ? EDIT_STEPS : ALL_STEPS;
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [sportSearch, setSportSearch] = useState('');
  const [toast, setToast] = useState(null);

  const stepAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value((1 / STEPS.length) * 100)).current;

  const isGoogle = user?.settings?.is_google ?? false;

  const initialSports =
    editMode && Array.isArray(user?.sports)
      ? user.sports.map((s) => ({
          sport: s.sport,
          skill: s.skill || 3,
          wins: s.wins || 0,
          termins_played: s.termins_played || 0,
        }))
      : user?.settings?.favorite_sports || [];

  const initialDob = typeof user?.date_of_birth === 'string' ? user.date_of_birth.split('-').map((n) => parseInt(n, 10)) : null;

  const today = new Date();
  const defaultYear = today.getFullYear() - 18;

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    avatar_url: user?.avatar_url || '',
    bio: user?.settings?.bio || '',
    dob_day: initialDob ? initialDob[2] : today.getDate(),
    dob_month: initialDob ? initialDob[1] : today.getMonth() + 1,
    dob_year: initialDob ? initialDob[0] : defaultYear,
    country: user?.country || user?.settings?.country || '',
    city: user?.location || user?.settings?.city || '',
    favorite_sports: initialSports,
    player_level: user?.player_level || user?.settings?.player_level || '',
  });

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const showToast = useCallback((message) => setToast({ message, id: Date.now() }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: ((stepIndex + 1) / STEPS.length) * 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [stepIndex]);

  useEffect(() => {
    if (!editMode && !user?.settings?.country && !user?.settings?.city) {
      fetch('https://get.geojs.io/v1/ip/geo.json')
        .then((res) => res.json())
        .then((data) => {
          let mappedCountry = '';
          if (data.country === 'Croatia') mappedCountry = 'Hrvatska';
          else if (data.country === 'Bosnia and Herzegovina') mappedCountry = 'Bosna i Hercegovina';
          if (mappedCountry) {
            setForm((p) => ({
              ...p,
              country: p.country || mappedCountry,
              city: p.city || data.city || '',
            }));
          }
        })
        .catch(() => {});
    }
  }, []);

  const availableCities = form.country ? citiesByCountry[form.country] || [] : [];
  const filteredCities = citySearch.trim() ? availableCities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase())) : availableCities;

  const allSportNames = [...new Set([...SPORT_OPTIONS, ...form.favorite_sports.map((s) => s.sport)])];
  const filteredSports = sportSearch.trim() ? allSportNames.filter((s) => s.toLowerCase().includes(sportSearch.toLowerCase())) : SPORT_OPTIONS;

  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => currentYear - MIN_AGE - i);
  const dayOptions = Array.from({ length: daysInMonth(form.dob_month, form.dob_year) }, (_, i) => i + 1);
  const monthOptions = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
  const previewAge = form.dob_day && form.dob_month && form.dob_year ? calcAge(form.dob_year, form.dob_month, form.dob_day) : null;
  const dobUnderage = previewAge !== null && previewAge < MIN_AGE;

  const getStepError = () => {
    if (currentStep === 'username' && form.username.trim().length < 3) {
      return 'Korisničko ime mora imati najmanje 3 znaka.';
    }
    if (currentStep === 'birthdate') {
      if (!form.dob_day || !form.dob_month || !form.dob_year) return 'Odaberite puni datum rođenja.';
      const age = calcAge(form.dob_year, form.dob_month, form.dob_day);
      if (age < MIN_AGE) return `Morate imati najmanje ${MIN_AGE} godina.`;
      if (age > MAX_AGE) return 'Unesite ispravan datum rođenja.';
    }
    if (currentStep === 'city') {
      if (!form.country) return 'Odaberite državu.';
      if (!form.city) return 'Odaberite grad.';
    }
    return null;
  };

  const isStepRequired = currentStep === 'username' || currentStep === 'birthdate' || currentStep === 'city';
  const nextDisabled = loading || (currentStep === 'birthdate' && !!getStepError());

  const animateTo = (nextIndex) => {
    Animated.timing(stepAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setStepIndex(nextIndex);
      Animated.timing(stepAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    setToast(null);
    const error = getStepError();
    if (error) {
      showToast(error);
      return;
    }
    if (isLastStep) {
      handleFinish();
      return;
    }
    animateTo(stepIndex + 1);
  };

  const handleSkip = () => {
    setToast(null);
    if (editMode || isLastStep) {
      handleFinish();
      return;
    }
    animateTo(stepIndex + 1);
  };

  const handleBack = () => {
    setToast(null);
    if (stepIndex === 0) {
      if (editMode && onClose) onClose();
      return;
    }
    animateTo(stepIndex - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    setToast(null);

    const payload = {
      full_name: form.full_name.trim() || null,
      avatar_url: form.avatar_url || null,
      bio: form.bio,
      country: form.country || null,
      city: form.city || null,
      favorite_sports: form.favorite_sports,
      player_level: form.player_level || null,
    };

    try {
      if (editMode) {
        const result = await onEditFinish?.(payload);
        if (!result?.success) {
          showToast(result?.error || 'Nešto je pošlo po zlu.');
          setLoading(false);
          return;
        }
        onClose?.();
      } else {
        payload.username = form.username.trim().toLowerCase();
        payload.date_of_birth = form.dob_day && form.dob_month && form.dob_year ? `${form.dob_year}-${String(form.dob_month).padStart(2, '0')}-${String(form.dob_day).padStart(2, '0')}` : null;

        const result = await onFinish?.(payload);
        if (!result?.success) {
          showToast(result?.error || 'Nešto je pošlo po zlu.');
          setLoading(false);
        }
      }
    } catch (err) {
      showToast(err.message || 'Nešto je pošlo po zlu.');
      setLoading(false);
    }
  };

  const setDobPart = (part, value) => {
    setForm((p) => {
      const next = { ...p, [part]: value };
      const maxDay = daysInMonth(next.dob_month, next.dob_year);
      if (next.dob_day && next.dob_day > maxDay) next.dob_day = maxDay;
      return next;
    });
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Potreban je pristup galeriji.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setForm((p) => ({ ...p, avatar_url: asset.uri }));

    if (!user?.id) return;
    try {
      setAvatarLoading(true);
      const uploadedUrl = await onUploadAvatar?.(asset, user.id);
      if (uploadedUrl) setForm((p) => ({ ...p, avatar_url: uploadedUrl }));
    } catch {
      showToast('Neuspješna promjena slike.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const toggleSport = (sport) => {
    setForm((p) => {
      const exists = p.favorite_sports.find((s) => s.sport === sport);
      if (exists) {
        return { ...p, favorite_sports: p.favorite_sports.filter((s) => s.sport !== sport) };
      }
      if (p.favorite_sports.length >= 3) return p;
      return { ...p, favorite_sports: [...p.favorite_sports, { sport, skill: 3 }] };
    });
  };

  const addCustomSport = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (form.favorite_sports.find((s) => s.sport.toLowerCase() === trimmed.toLowerCase())) return;
    if (form.favorite_sports.length >= 3) return;
    setForm((p) => ({ ...p, favorite_sports: [...p.favorite_sports, { sport: trimmed, skill: 3 }] }));
    setSportSearch('');
  };

  const setSportSkill = (sport, skill) => {
    setForm((p) => ({
      ...p,
      favorite_sports: p.favorite_sports.map((s) => (s.sport === sport ? { ...s, skill } : s)),
    }));
  };

  const stepNumber = (idx) => String(idx + 1).padStart(2, '0');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <BLogo size={26} />
            <Text style={styles.brandText}>TerminBuddy</Text>
          </View>
          <Text style={styles.stepCounter}>{editMode ? 'Uredi profil' : `Korak ${stepIndex + 1} / ${STEPS.length}`}</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: stepAnim }}>
            {currentStep === 'identity' && (
              <StepShell num={stepNumber(stepIndex)} total={STEPS.length} title="Tvoje ime." help="Kako se zoveš? Ovo se prikazuje na tvom profilu.">
                <TextInput placeholder="Ime i prezime" placeholderTextColor={colors.textFaint} maxLength={20} value={form.full_name} onChangeText={(v) => setForm((p) => ({ ...p, full_name: v }))} style={styles.input} autoFocus />
                {isGoogle && form.full_name && !editMode && <Text style={styles.hint}>Povučeno s Google računa. Slobodno uredi.</Text>}
              </StepShell>
            )}

            {currentStep === 'username' && (
              <StepShell num={stepNumber(stepIndex)} total={STEPS.length} title="Odaberi korisničko ime." help="Jedinstveno ime koje drugi vide. Najmanje 3 znaka." required>
                <TextInput
                  placeholder="npr. ivana.t"
                  placeholderTextColor={colors.textFaint}
                  maxLength={20}
                  autoCapitalize="none"
                  value={form.username}
                  onChangeText={(v) => {
                    const val = v.replace(/\s/g, '').replace(/[^a-zA-Z0-9.\-_]/g, '');
                    setForm((p) => ({ ...p, username: val }));
                  }}
                  style={styles.input}
                />
                <Text style={styles.hint}>Samo slova, brojevi, točka, crtica i podvlaka. Bez razmaka.</Text>
              </StepShell>
            )}

            {currentStep === 'avatar' && (
              <StepShell num={stepNumber(stepIndex)} total={STEPS.length} title="Profilna slika" help={editMode ? 'Promijeni svoju profilnu sliku.' : 'Profilna slika pomaže ekipi da te prepozna. Možeš preskočiti i dodati kasnije.'}>
                <View style={styles.avatarWrap}>
                  <TouchableOpacity onPress={handlePickAvatar} style={[styles.avatarCircle, avatarLoading && { opacity: 0.5 }]} activeOpacity={0.85}>
                    {form.avatar_url ? (
                      <Image source={{ uri: form.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <UserIcon size={48} color={colors.textFaint} />
                      </View>
                    )}
                  </TouchableOpacity>
                  {avatarLoading && <Text style={styles.savingText}>Spremam...</Text>}
                </View>
              </StepShell>
            )}

            {currentStep === 'bio' && (
              <StepShell num={stepNumber(stepIndex)} total={STEPS.length} title="Reci nešto o sebi" help="Kratki opis - kako igraš, što voliš, kad si dostupan. Neobavezno.">
                <TextInput
                  placeholder="npr. Najdostupniji vikendima. Vanjski tereni++"
                  placeholderTextColor={colors.textFaint}
                  maxLength={280}
                  multiline
                  numberOfLines={4}
                  value={form.bio}
                  onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))}
                  style={styles.textarea}
                />
                <Text style={styles.counter}>{form.bio.length} / 280</Text>
              </StepShell>
            )}

            {currentStep === 'birthdate' && (
              <StepShell num={stepNumber(stepIndex)} total={STEPS.length} title="Kada si rođen?" help="Zavrti kotačić i odaberi datum rođenja. Na profilu prikazujemo samo tvoje godine." required>
                <View style={styles.wheelLabelsRow}>
                  <Text style={styles.wheelLabel}>Dan</Text>
                  <Text style={styles.wheelLabel}>Mjesec</Text>
                  <Text style={styles.wheelLabel}>Godina</Text>
                </View>
                <View style={styles.wheelContainer}>
                  <View style={styles.wheelHighlight} pointerEvents="none" />
                  <View style={styles.wheelRow}>
                    <View style={{ flex: 1 }}>
                      <WheelColumn options={dayOptions} value={form.dob_day} onSelect={(v) => setDobPart('dob_day', v)} />
                    </View>
                    <View style={{ flex: 1.4 }}>
                      <WheelColumn options={monthOptions} value={form.dob_month} onSelect={(v) => setDobPart('dob_month', v)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <WheelColumn options={yearOptions} value={form.dob_year} onSelect={(v) => setDobPart('dob_year', v)} />
                    </View>
                  </View>
                </View>
                <View style={{ marginTop: 16, minHeight: 24 }}>
                  {dobUnderage ? (
                    <Text style={styles.errorText}>Moraš imati najmanje {MIN_AGE} godina za registraciju.</Text>
                  ) : (
                    previewAge !== null && (
                      <Text style={styles.previewAge}>
                        {form.dob_day}. {MONTHS[form.dob_month - 1]} {form.dob_year}. — {previewAge} godina
                      </Text>
                    )
                  )}
                </View>
              </StepShell>
            )}

            {currentStep === 'city' && (
              <StepShell num={stepNumber(stepIndex)} total={STEPS.length} title="Odakle si?" help="Odaberi državu pa grad. Prikazujemo ti termine u tvojoj blizini." required>
                <View style={styles.countryRow}>
                  <TouchableOpacity onPress={() => setForm((p) => ({ ...p, country: 'Hrvatska', city: '' }))} style={[styles.countryBtn, form.country === 'Hrvatska' && styles.countryBtnActive]}>
                    <Text style={[styles.countryText, form.country === 'Hrvatska' && { color: colors.logoGreen }]}>Hrvatska</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setForm((p) => ({ ...p, country: 'Bosna i Hercegovina', city: '' }))} style={[styles.countryBtn, form.country === 'Bosna i Hercegovina' && styles.countryBtnActive]}>
                    <Text style={[styles.countryText, form.country === 'Bosna i Hercegovina' && { color: colors.logoGreen }]}>BiH</Text>
                  </TouchableOpacity>
                </View>

                {form.country && (
                  <View>
                    <View style={styles.searchBox}>
                      <SearchIcon size={18} />
                      <TextInput
                        placeholder="Traži grad ili upiši vlastiti..."
                        placeholderTextColor={colors.textFaint}
                        value={citySearch}
                        onChangeText={setCitySearch}
                        onSubmitEditing={() => citySearch.trim() && setForm((p) => ({ ...p, city: citySearch.trim() }))}
                        style={styles.searchInput}
                      />
                    </View>
                    <View style={styles.chipsWrap}>
                      {filteredCities.map((c) => (
                        <TouchableOpacity
                          key={c}
                          onPress={() => {
                            setForm((p) => ({ ...p, city: c }));
                            setCitySearch('');
                          }}
                          style={[styles.chip, form.city === c && styles.chipSelected]}
                        >
                          <Text style={[styles.chipText, form.city === c && { color: '#000', fontWeight: '600' }]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                      {citySearch.trim() && !filteredCities.some((c) => c.toLowerCase() === citySearch.trim().toLowerCase()) && (
                        <TouchableOpacity
                          onPress={() => {
                            setForm((p) => ({ ...p, city: citySearch.trim() }));
                            setCitySearch('');
                          }}
                          style={styles.customChip}
                        >
                          <Text style={styles.customChipText}>+ "{citySearch.trim()}"</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {form.city && !availableCities.includes(form.city) && (
                      <Text style={styles.hint}>
                        Vlastiti grad: <Text style={{ color: colors.logoGreen, fontWeight: '600' }}>{form.city}</Text>
                      </Text>
                    )}
                  </View>
                )}
              </StepShell>
            )}

            {currentStep === 'sports' && (
              <StepShell num={stepNumber(stepIndex)} total={STEPS.length} title="Najdraži sportovi" help="Odaberi do 3 sporta i označi koliko si dobar u svakom.">
                <View style={styles.searchBox}>
                  <SearchIcon size={18} />
                  <TextInput
                    placeholder="Traži sport ili upiši vlastiti..."
                    placeholderTextColor={colors.textFaint}
                    value={sportSearch}
                    onChangeText={setSportSearch}
                    onSubmitEditing={() => sportSearch.trim() && addCustomSport(sportSearch)}
                    style={styles.searchInput}
                  />
                </View>

                {sportSearch.trim() && !filteredSports.some((s) => s.toLowerCase() === sportSearch.trim().toLowerCase()) && (
                  <TouchableOpacity onPress={() => addCustomSport(sportSearch)} style={styles.addSportBtn}>
                    <Text style={styles.customChipText}>+ Dodaj "{sportSearch.trim()}"</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.sportsGrid}>
                  {filteredSports.map((sport) => {
                    const selected = form.favorite_sports.find((s) => s.sport === sport);
                    return (
                      <TouchableOpacity key={sport} onPress={() => toggleSport(sport)} style={[styles.sportOpt, selected && styles.sportOptSelected]}>
                        <Text style={{ fontSize: 18 }}>{SPORT_ICONS[sport] || '⚽'}</Text>
                        <Text style={[styles.sportOptText, selected && { color: '#000' }]}>{sport}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {form.favorite_sports.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Odaberi svoju razinu u sportovima</Text>
                    <View style={{ gap: 8 }}>
                      {form.favorite_sports.map((s) => (
                        <View key={s.sport} style={styles.skillRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 16 }}>{SPORT_ICONS[s.sport] || '⚽'}</Text>
                            <Text style={styles.skillRowText}>{s.sport}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <TouchableOpacity key={n} onPress={() => setSportSkill(s.sport, n)} style={[styles.skillBar, n <= s.skill && styles.skillBarOn]} />
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </StepShell>
            )}

            {currentStep === 'level' && (
              <StepShell num={stepNumber(stepIndex)} total={STEPS.length} title="Tvoja razina igranja" help="Općeniti opis tvoje razine. Neobavezno.">
                <View style={{ gap: 8 }}>
                  {LEVELS.map((lvl) => (
                    <TouchableOpacity key={lvl.id} onPress={() => setForm((p) => ({ ...p, player_level: lvl.id }))} style={[styles.levelCard, form.player_level === lvl.id && styles.levelCardSelected]}>
                      <Text style={styles.levelName}>{lvl.name}</Text>
                      <Text style={styles.levelDesc}>{lvl.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </StepShell>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleBack} disabled={stepIndex === 0 && !editMode} style={[styles.backBtn, stepIndex === 0 && !editMode && { opacity: 0.3 }]}>
            <Text style={styles.backBtnText}>{stepIndex === 0 && editMode ? 'Odustani' : 'Nazad'}</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {!isStepRequired && (
              <TouchableOpacity onPress={handleSkip} disabled={loading} style={styles.skipBtn}>
                <Text style={styles.skipBtnText}>{editMode ? 'Spremi' : 'Preskoči'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleNext} disabled={nextDisabled} style={[styles.nextBtn, nextDisabled && { opacity: 0.5 }]}>
              {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.nextBtnText}>{isLastStep ? 'Spremi' : 'Dalje'}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {toast && (
          <View style={styles.toastWrap}>
            <Toast toast={toast} onDismiss={dismissToast} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
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
  stepCounter: {
    color: colors.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.line,
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.logoGreen,
  },
  input: {
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  hint: {
    color: colors.textFaint,
    fontSize: 12,
    marginTop: 10,
  },
  textarea: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 110,
    borderRadius: radius.lg,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
    textAlignVertical: 'top',
  },
  counter: {
    color: colors.textFaint,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },
  avatarWrap: {
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.borderColor,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    color: colors.logoGreen,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  wheelLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  wheelLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '500',
  },
  wheelContainer: {
    position: 'relative',
    borderRadius: 18,
    backgroundColor: colors.bg2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line2,
  },
  wheelHighlight: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: '50%',
    marginTop: -20,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.greenSoft,
  },
  wheelRow: {
    flexDirection: 'row',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  previewAge: {
    color: colors.textSec,
    fontSize: 15,
  },
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
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  chipSelected: {
    backgroundColor: colors.logoGreen,
    borderColor: colors.logoGreen,
  },
  chipText: {
    color: colors.textSec,
    fontSize: 13,
  },
  customChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
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
  addSportBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.logoGreen,
    marginBottom: 16,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  sportOpt: {
    width: '31%',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 4,
  },
  sportOptSelected: {
    backgroundColor: colors.logoGreen,
    borderColor: colors.logoGreen,
  },
  sportOptText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionLabel: {
    color: colors.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    fontWeight: '500',
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  skillRowText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  skillBar: {
    width: 16,
    height: 7,
    borderRadius: 3,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  skillBarOn: {
    backgroundColor: colors.logoGreen,
    borderColor: colors.logoGreen,
  },
  levelCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  levelCardSelected: {
    borderColor: colors.logoGreen,
    backgroundColor: colors.greenSoft,
  },
  levelName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  levelDesc: {
    color: colors.textSec,
    fontSize: 12.5,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.line2,
    backgroundColor: colors.background,
  },
  backBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  backBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  skipBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  skipBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  nextBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.logoGreen,
    minWidth: 90,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  toastWrap: {
    position: 'absolute',
    bottom: 90,
    left: 16,
  },
});
