import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RadioDot from '../../components/RadioDot';
import StepHeading from '../../components/StepHeading';
import { SKILL_OPTIONS } from '../../data/data';
import { colors } from '../../theme/colors';

export default function StepSkill({ form, set }) {
  return (
    <>
      <StepHeading title="Razina igrača." desc="Postavi razinu koju očekuješ kako bi se prijavili pravi igrači." />
      <View style={{ gap: 8 }}>
        {SKILL_OPTIONS.map((opt) => {
          const selected = form.skill_level === opt.value;
          return (
            <TouchableOpacity key={opt.value} onPress={() => set('skill_level', opt.value)} style={[styles.card, selected && styles.cardSelected]} activeOpacity={0.85}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{opt.label}</Text>
                  {opt.bars > 0 && (
                    <View style={styles.barsRow}>
                      {[1, 2, 3].map((n) => (
                        <View key={n} style={[styles.bar, { backgroundColor: n <= opt.bars ? colors.logoGreen : colors.textFaint, opacity: n <= opt.bars ? 1 : 0.3 }]} />
                      ))}
                    </View>
                  )}
                </View>
                <Text style={styles.desc}>{opt.desc}</Text>
              </View>
              <RadioDot selected={selected} />
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.logoGreen,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  barsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    width: 16,
    height: 6,
    borderRadius: 3,
  },
  desc: {
    color: colors.textSec,
    fontSize: 12.5,
    lineHeight: 18,
  },
});
