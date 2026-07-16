import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius } from '../theme/colors';

export function Toast({ toast, onDismiss }) {
  const anim = useRef(new Animated.Value(0)).current;
  const isError = toast.type !== 'success';

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
        isError && styles.containerError,
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
      <TouchableOpacity onPress={onDismiss} hitSlop={10} style={styles.dismissBtn}>
        <Text style={styles.dismiss}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.line2,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    width: '100%',
  },
  containerError: {
    borderColor: colors.danger,
  },
  text: {
    color: colors.text,
    fontSize: 13,
    textAlign: 'left',
  },
  dismissBtn: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismiss: {
    color: colors.textFaint,
    fontSize: 14,
  },
});
