import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

export default function ReviewCell({ label, value, onEdit }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity onPress={onEdit} style={styles.editBtn} hitSlop={8}>
        <Text style={styles.editText}>Uredi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    minWidth: '48%',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    position: 'relative',
  },
  label: {
    color: colors.textSec,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  editBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  editText: {
    color: colors.textSec,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
