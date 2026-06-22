import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  rightSlot,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, focused && styles.labelFocused]}>
        {label}
      </Text>
      <View
        style={[styles.inputRow, focused && styles.inputRowFocused]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textFaint}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {rightSlot}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    color: theme.textSec,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingLeft: 2,
  },
  labelFocused: { color: theme.logoGreen },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bg2,
    borderWidth: 1,
    borderColor: theme.line2,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  inputRowFocused: { borderColor: theme.logoGreen, backgroundColor: theme.bg3 },
  input: { flex: 1, color: theme.text, fontSize: 16, paddingVertical: 16 },
});