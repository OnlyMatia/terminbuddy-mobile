import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import StepHeading from '../../components/StepHeading';
import { SLOT_PRESETS } from '../../data/data';
import { colors, radius } from '../../theme/colors';
import { formatPrice } from '../../utils/utils';

const NO_SLOTS_MSG = 'Nema slobodnih mjesta za prijave kroz aplikaciju. Smanji broj vanjskih igrača ili povećaj ukupan broj mjesta.';

function RoundBtn({ onPress, disabled, size = 48, children }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.roundBtn, { width: size, height: size, borderRadius: size * 0.3, opacity: disabled ? 0.3 : 1 }]}>
      <Text style={styles.roundBtnText}>{children}</Text>
    </TouchableOpacity>
  );
}

export default function StepSlots({ form, set, perPlayer, showToast = () => {} }) {
  const externalPlayers = form.current_players || 0;
  const totalFilled = externalPlayers + 1;
  const isFull = totalFilled >= form.max_players;
  const currencySymbol = (form.currency || 'BAM') === 'EUR' ? '€' : 'KM';

  const handleExternalIncrement = () => {
    const next = externalPlayers + 1;
    if (next + 1 >= form.max_players) showToast(NO_SLOTS_MSG);
    set('current_players', Math.min(form.max_players - 1, next));
  };

  const handleMaxPlayersDecrease = () => {
    const newMax = Math.max(2, form.max_players - 1);
    if (externalPlayers + 1 >= newMax) {
      showToast(NO_SLOTS_MSG);
      set('current_players', Math.max(0, newMax - 2));
    }
    set('max_players', newMax);
  };

  const handlePresetSelect = (n) => {
    if (externalPlayers + 1 >= n) {
      set('current_players', Math.max(0, n - 2));
      showToast('Broj vanjskih igrača je smanjen jer bi popunio sva mjesta.');
    }
    set('max_players', n);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <StepHeading title="Koliko igrača?" desc="Postavi veličinu ekipe i cijenu. TerminBuddy ravnomjerno dijeli trošak terena među prijavljenim igračima." />

      <View style={styles.counterCard}>
        <Text style={styles.counterValue}>{form.max_players}</Text>
        <Text style={styles.counterLabel}>Potrebno ukupno igrača</Text>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <RoundBtn onPress={handleMaxPlayersDecrease} disabled={form.max_players <= 2}>
            −
          </RoundBtn>
          <RoundBtn onPress={() => set('max_players', Math.min(30, form.max_players + 1))} disabled={form.max_players >= 30}>
            +
          </RoundBtn>
        </View>
        <View style={styles.presetRow}>
          {SLOT_PRESETS.map((n) => {
            const selected = form.max_players === n;
            return (
              <TouchableOpacity key={n} onPress={() => handlePresetSelect(n)} style={[styles.presetChip, selected && styles.presetChipSelected]}>
                <Text style={[styles.presetChipText, selected && { color: '#000', fontWeight: '600' }]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Već imaš igrače?</Text>
      <View style={styles.externalRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.externalTitle}>Vanjski igrači</Text>
          <Text style={styles.externalDesc}>Igrači koje dovodiš a nemaju račun. Ti si automatski ubrojan.</Text>
        </View>
        <View style={styles.externalCounter}>
          <RoundBtn size={38} onPress={() => set('current_players', Math.max(0, externalPlayers - 1))} disabled={externalPlayers <= 0}>
            −
          </RoundBtn>
          <Text style={styles.externalValue}>{externalPlayers}</Text>
          <RoundBtn size={38} onPress={handleExternalIncrement} disabled={externalPlayers >= form.max_players - 1}>
            +
          </RoundBtn>
        </View>
      </View>

      <View style={[styles.filledBox, isFull && styles.filledBoxFull]}>
        <Text style={[styles.filledLabel, isFull && { color: '#ff4a5c' }]}>Ukupno popunjeno</Text>
        <Text style={[styles.filledValue, isFull && { color: '#ff4a5c' }]}>
          {totalFilled} / {form.max_players}
          {isFull && ' — nema mjesta'}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Cijena</Text>
      <View style={styles.priceTypeRow}>
        <TouchableOpacity
          onPress={() => {
            set('priceType', 'free');
            set('price', 0);
          }}
          style={[styles.priceTypeCard, form.priceType === 'free' && styles.priceTypeCardSelected]}
        >
          <Text style={styles.priceTypeTitle}>Besplatno</Text>
          <Text style={styles.priceTypeSub}>Bez naknade</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            set('priceType', 'paid');
            if (form.price === 0) set('price', 50);
          }}
          style={[styles.priceTypeCard, form.priceType === 'paid' && styles.priceTypeCardSelected]}
        >
          <Text style={styles.priceTypeTitle}>Plaćeno</Text>
          <Text style={styles.priceTypeSub}>Podijeli trošak</Text>
        </TouchableOpacity>
      </View>

      {form.priceType === 'paid' && (
        <>
          <View style={styles.priceInputWrap}>
            <TextInput
              keyboardType="numeric"
              value={form.price ? String(form.price) : ''}
              onChangeText={(v) => {
                if (v === '0') {
                  set('price', 0);
                  set('priceType', 'free');
                  return;
                }
                let val = parseFloat(v) || 0;
                if (val > 200) val = 200;
                set('price', val);
              }}
              placeholder="0"
              placeholderTextColor={colors.textFaint}
              style={styles.priceInput}
            />
            <Text style={styles.priceSuffix}>{currencySymbol} ukupno</Text>
          </View>
          <View style={styles.splitRow}>
            <Text style={styles.splitLabel}>Podijeljeno na {form.max_players} igrača</Text>
            <Text style={styles.splitValue}>{formatPrice(perPlayer, form.currency || 'BAM')} / igrač</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  roundBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  roundBtnText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '500',
  },
  counterCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
  },
  counterValue: {
    color: colors.logoGreen,
    fontSize: 72,
    letterSpacing: -2,
    lineHeight: 78,
  },
  counterLabel: {
    color: colors.textSec,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 20,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  presetChipSelected: {
    backgroundColor: colors.logoGreen,
    borderColor: colors.logoGreen,
  },
  presetChipText: {
    color: colors.textSec,
    fontSize: 12,
  },
  sectionLabel: {
    color: colors.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 6,
    fontWeight: '500',
  },
  externalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
    gap: 12,
  },
  externalTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  externalDesc: {
    color: colors.textSec,
    fontSize: 12,
    lineHeight: 17,
  },
  externalCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  externalValue: {
    color: colors.logoGreen,
    fontSize: 22,
    minWidth: 26,
    textAlign: 'center',
  },
  filledBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 24,
  },
  filledBoxFull: {
    backgroundColor: 'rgba(255,74,92,0.08)',
    borderColor: 'rgba(255,74,92,0.3)',
  },
  filledLabel: {
    color: colors.textSec,
    fontSize: 12,
  },
  filledValue: {
    color: colors.logoGreen,
    fontSize: 12,
    fontWeight: '500',
  },
  priceTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  priceTypeCard: {
    flex: 1,
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  priceTypeCardSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.logoGreen,
  },
  priceTypeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  priceTypeSub: {
    color: colors.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceInputWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  priceInput: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '500',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingRight: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  priceSuffix: {
    position: 'absolute',
    right: 20,
    top: 24,
    color: colors.textSec,
    fontSize: 14,
    fontWeight: '500',
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  splitLabel: {
    color: colors.textSec,
    fontSize: 13,
  },
  splitValue: {
    color: colors.logoGreen,
    fontSize: 13,
    fontWeight: '500',
  },
});
