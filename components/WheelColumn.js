import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const ITEM_H = 40;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

export default function WheelColumn({ options, value, onSelect }) {
  const ref = useRef(null);
  const getVal = (o) => (typeof o === 'object' ? o.value : o);
  const getLabel = (o) => (typeof o === 'object' ? o.label : String(o));

  const valueIndex = options.findIndex((o) => getVal(o) === value);
  const [active, setActive] = useState(valueIndex < 0 ? 0 : valueIndex);

  useEffect(() => {
    const idx = options.findIndex((o) => getVal(o) === value);
    const target = idx < 0 ? 0 : idx;
    setActive(target);
    requestAnimationFrame(() => {
      ref.current?.scrollTo({ y: target * ITEM_H, animated: false });
    });
  }, [value, options.length]);

  const handleMomentumEnd = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.max(0, Math.min(options.length - 1, Math.round(y / ITEM_H)));
    setActive(idx);
    const v = getVal(options[idx]);
    if (v !== value) onSelect(v);
  };

  return (
    <ScrollView ref={ref} showsVerticalScrollIndicator={false} snapToInterval={ITEM_H} decelerationRate="fast" onMomentumScrollEnd={handleMomentumEnd} contentContainerStyle={{ paddingVertical: PAD }} style={styles.column}>
      {options.map((o, i) => {
        const dist = Math.abs(i - active);
        const opacity = dist === 0 ? 1 : dist === 1 ? 0.5 : dist === 2 ? 0.25 : 0.12;
        const isCenter = i === active;
        return (
          <View key={getVal(o)} style={styles.item}>
            <Text
              style={{
                color: isCenter ? colors.logoGreen : colors.text,
                opacity,
                fontSize: isCenter ? 17 : 15,
                fontWeight: isCenter ? '600' : '400',
              }}
            >
              {getLabel(o)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  column: {
    height: ITEM_H * VISIBLE,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
