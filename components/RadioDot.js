import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { CheckIcon } from './Icons';

export default function RadioDot({ selected }) {
  return (
    <View
      style={[
        styles.dot,
        {
          borderColor: selected ? colors.logoGreen : colors.line2,
          backgroundColor: selected ? colors.logoGreen : 'transparent',
        },
      ]}
    >
      {selected && <CheckIcon size={10} color="#000" />}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
