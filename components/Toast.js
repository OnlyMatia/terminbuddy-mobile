import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius } from '../theme/colors';

export function Toast({ toast, onDismiss }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(onDismiss);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast.id]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.text}>{toast.message}</Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={10}>
        <Text style={styles.dismiss}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.line2,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  text: {
    color: colors.text,
    fontSize: 13,
    flexShrink: 1,
  },
  dismiss: {
    color: colors.textFaint,
    fontSize: 14,
  },
});
