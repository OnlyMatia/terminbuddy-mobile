import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/colors';

export default function Badge({ badge }) {
  const IconComp = badge.Icon;

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: badge.bgColor || colors.greenSoft }]}>{IconComp ? <IconComp size={20} color="#fff" /> : <Text style={{ fontSize: 18 }}>{badge.icon || '🏆'}</Text>}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>
          {badge.name}
        </Text>
        {badge.desc ? (
          <Text style={styles.desc} numberOfLines={1}>
            {badge.desc}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  name: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  desc: {
    color: colors.textSec,
    fontSize: 11,
    marginTop: 1,
  },
});
