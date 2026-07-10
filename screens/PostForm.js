import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CloseIcon } from '../components/Icons';
import { Toast } from '../components/Toast';
import { colors } from '../theme/colors';
import StepCity from './post-steps/StepCity';
import StepDateTime from './post-steps/StepDateTime';
import StepReview from './post-steps/StepReview';
import StepSkill from './post-steps/StepSkill';
import StepSlots from './post-steps/StepSlots';
import StepSport from './post-steps/StepSport';
import StepTitle from './post-steps/StepTitle';

const TOTAL_STEPS = 7;

export default function PostForm({ userProfile, onCreateTermin }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdTerminId, setCreatedTerminId] = useState(null);
  const [showAllSports, setShowAllSports] = useState(false);
  const [sportSearch, setSportSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const stepAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value((1 / TOTAL_STEPS) * 100)).current;

  const defaultCountry = userProfile?.settings?.country || 'Bosna i Hercegovina';
  const defaultCity = userProfile?.location || userProfile?.settings?.city || '';
  const defaultCurrency = userProfile?.currency || 'BAM';

  const [form, setForm] = useState({
    sport: '',
    title: '',
    country: defaultCountry,
    city: defaultCity,
    playground: '',
    description: '',
    date: '',
    time: '',
    skill_level: 'Mješovita',
    max_players: 10,
    current_players: 0,
    price: 50,
    currency: defaultCurrency,
    priceType: 'paid',
    auto_accept: false,
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const showToast = useCallback((message) => {
    setToast({ message, id: Date.now() });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step / TOTAL_STEPS) * 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const goTo = useCallback(
    (target) => {
      if (target < 1 || target > TOTAL_STEPS) return;
      Animated.timing(stepAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setStep(target);
        Animated.timing(stepAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    },
    [stepAnim],
  );

  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return !!form.sport;
      case 2:
        return (form.title || '').trim().length > 0;
      case 3:
        return !!form.date && !!form.time;
      case 4:
        return !!form.country.trim() && !!form.city.trim();
      case 5:
        return !!form.skill_level;
      case 6: {
        const totalFilled = (form.current_players || 0) + 1;
        return form.max_players >= 2 && totalFilled < form.max_players;
      }
      case 7:
        return true;
      default:
        return false;
    }
  }, [step, form]);

  const perPlayer = form.max_players > 0 && form.price > 0 ? Number((form.price / form.max_players).toFixed(1)) : 0;

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      const response = await onCreateTermin?.(form);
      if (response?.success) {
        setCreatedTerminId(response.data?.id || null);
        setSuccess(true);
      } else {
        showToast(response?.message || 'Došlo je do greške.');
      }
    } catch (err) {
      showToast(err.message || 'Došlo je do greške.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 6) {
      const totalFilled = (form.current_players || 0) + 1;
      if (totalFilled >= form.max_players) {
        showToast('Sva mjesta su popunjena vanjskim igračima. Smanji broj vanjskih igrača ili povećaj ukupan broj mjesta.');
        return;
      }
    }
    if (step === TOTAL_STEPS) {
      handleSubmit();
    } else {
      goTo(step + 1);
    }
  };

  if (success) {
    return (
      <View style={styles.successScreen}>
        <View style={styles.successIcon}>
          <Text style={{ fontSize: 44, color: colors.logoGreen }}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Termin je objavljen.</Text>
        <Text style={styles.successDesc}>Tvoj termin je sada vidljiv igračima u blizini. Dobit ćeš obavijest čim se netko pridruži.</Text>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {createdTerminId && (
            <TouchableOpacity style={styles.successPrimaryBtn} onPress={() => router.push(`/termin/${createdTerminId}`)}>
              <Text style={styles.successPrimaryBtnText}>Pogledaj termin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.successSecondaryBtn} onPress={() => router.replace('/(tabs)/my-termins')}>
            <Text style={styles.successSecondaryBtnText}>Natrag na termine</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.topRow}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            Korak <Text style={{ color: colors.logoGreen, fontWeight: '600' }}>0{step}</Text>
            <Text style={{ color: colors.textFaint }}> / 0{TOTAL_STEPS}</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.discardBtn} onPress={() => router.back()}>
          <CloseIcon size={16} />
          <Text style={styles.discardText}>Odbaci</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: stepAnim }}>
          {step === 1 && <StepSport form={form} set={set} showAllSports={showAllSports} setShowAllSports={setShowAllSports} sportSearch={sportSearch} setSportSearch={setSportSearch} />}
          {step === 2 && <StepTitle form={form} set={set} />}
          {step === 3 && <StepDateTime form={form} set={set} />}
          {step === 4 && <StepCity form={form} set={set} />}
          {step === 5 && <StepSkill form={form} set={set} />}
          {step === 6 && <StepSlots form={form} set={set} perPlayer={perPlayer} showToast={showToast} />}
          {step === 7 && <StepReview form={form} set={set} perPlayer={perPlayer} goTo={goTo} error={submitError} />}
        </Animated.View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  width: i + 1 === step ? 18 : 6,
                  backgroundColor: i + 1 <= step ? colors.logoGreen : colors.bg3,
                },
              ]}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => goTo(step - 1)} disabled={step === 1} style={[styles.backBtn, step === 1 && { opacity: 0.4 }]}>
            <Text style={styles.backBtnText}>Nazad</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} disabled={!canNext || loading} style={[styles.nextBtn, (!canNext || loading) && { opacity: 0.4 }]}>
            <Text style={styles.nextBtnText}>{loading ? '...' : step === TOTAL_STEPS ? 'Objavi' : 'Dalje'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {toast && (
        <View style={styles.toastWrap}>
          <Toast toast={toast} onDismiss={dismissToast} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.line,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.logoGreen,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  stepBadge: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  stepBadgeText: {
    color: colors.textSec,
    fontSize: 12,
    fontWeight: '500',
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  discardText: {
    color: colors.textSec,
    fontSize: 12,
    fontWeight: '500',
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.line2,
    backgroundColor: 'rgba(10,12,9,0.95)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  backBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  nextBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.logoGreen,
    borderWidth: 1,
    borderColor: colors.logoGreen,
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
  successScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenSoft,
    borderWidth: 2,
    borderColor: colors.logoGreen,
    marginBottom: 32,
  },
  successTitle: {
    color: colors.logoGreen,
    fontSize: 40,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 16,
  },
  successDesc: {
    color: colors.textSec,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 380,
  },
  successPrimaryBtn: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.logoGreen,
  },
  successPrimaryBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  successSecondaryBtn: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  successSecondaryBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
});
