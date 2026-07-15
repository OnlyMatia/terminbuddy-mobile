import { StyleSheet, Text, View } from 'react-native';
import CustomDatePicker from '../../components/CustomDatePicker';
import CustomTimePicker from '../../components/CustomTimePicker';
import StepHeading from '../../components/StepHeading';
import { colors } from '../../theme/colors';

export default function StepDateTime({ form, set }) {
  return (
    <>
      <StepHeading title="Kada igraš?" desc="Odaberi datum i vrijeme. Što ranije objaviš, veće su šanse za punu ekipu." />

      <View style={{ gap: 24 }}>
        <View>
          <Text style={styles.label}>Datum</Text>
          <CustomDatePicker value={form.date} onChange={(v) => set('date', v)} />
        </View>
        <View>
          <Text style={styles.label}>Vrijeme</Text>
          <CustomTimePicker value={form.time} onChange={(v) => set('time', v)} step={30} date={form.date} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: '500',
  },
});
