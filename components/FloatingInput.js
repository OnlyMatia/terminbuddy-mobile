import { useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius } from '../theme/colors';

export function FloatingInput({ label, value, onChangeText, onFocus, onBlur, secureTextEntry, keyboardType, autoCapitalize = 'none', icon, rightIcon, onRightIconPress }) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const animateTo = (toValue) => {
    Animated.timing(anim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleFocus = (e) => {
    setFocused(true);
    animateTo(1);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    if (!value) animateTo(0);
    onBlur && onBlur(e);
  };

  const active = focused || !!value;

  return (
    <View style={[styles.container, { borderColor: focused ? colors.logoGreen : colors.line2 }]}>
      <Animated.Text
        style={[
          styles.label,
          {
            top: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 6] }),
            fontSize: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 10] }),
            color: active ? colors.logoGreen : colors.textSec,
            letterSpacing: active ? 1 : 0,
          },
        ]}
      >
        {label}
      </Animated.Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, { paddingRight: rightIcon ? 44 : icon ? 44 : 16 }]}
        placeholderTextColor={colors.textFaint}
        selectionColor={colors.logoGreen}
      />
      {icon && <View style={styles.iconLeft}>{icon}</View>}
      {rightIcon && (
        <Animated.View onTouchEnd={onRightIconPress} style={styles.iconRight}>
          {rightIcon}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(10,12,9,0.6)',
    minHeight: 58,
  },
  label: {
    position: 'absolute',
    left: 18,
    fontWeight: '500',
  },
  input: {
    color: colors.text,
    fontSize: 15,
    paddingTop: 22,
    paddingBottom: 10,
    paddingLeft: 16,
  },
  iconLeft: {
    position: 'absolute',
    right: 16,
    top: 20,
  },
  iconRight: {
    position: 'absolute',
    right: 14,
    top: 18,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
