import { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import StepHeading from '../../components/StepHeading';
import { colors, radius } from '../../theme/colors';

export default function StepTitle({ form, set }) {
  const descRef = useRef(null);

  return (
    <>
      <StepHeading title="Daj mu ime." desc="Kratak naslov i par riječi o tome šta očekivati. Budi iskren oko atmosfere — kompetitivno, opušteno, za početnike." />

      <TextInput
        placeholder="npr. 5v5 termin na Bijelom Brijegu"
        placeholderTextColor={colors.textFaint}
        maxLength={20}
        value={form.title || ''}
        onChangeText={(v) => set('title', v)}
        returnKeyType="next"
        onSubmitEditing={() => descRef.current?.focus()}
        style={styles.titleInput}
      />

      <View style={{ position: 'relative' }}>
        <TextInput
          ref={descRef}
          placeholder="Opcionalno. Opiši format, atmosferu, šta ponijeti, koga tražiš..."
          placeholderTextColor={colors.textFaint}
          maxLength={280}
          multiline
          numberOfLines={4}
          value={form.description || ''}
          onChangeText={(v) => set('description', v)}
          style={styles.descInput}
        />
        <Text style={styles.counter}>{(form.description || '').length} / 280</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    color: colors.text,
    fontSize: 18,
    letterSpacing: -0.3,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
    marginBottom: 20,
  },
  descInput: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 110,
    borderRadius: radius.lg,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line2,
    textAlignVertical: 'top',
  },
  counter: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '500',
  },
});
