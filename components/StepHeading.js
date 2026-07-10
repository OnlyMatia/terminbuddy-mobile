import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export default function StepHeading({ title, desc }) {
  return (
    <>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{desc}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 34,
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 12,
  },
  desc: {
    color: colors.textSec,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
});
