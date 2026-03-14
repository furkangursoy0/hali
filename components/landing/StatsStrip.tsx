import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const isWeb = Platform.OS === 'web';

interface Props {
  isWide: boolean;
  totalCarpets: string;
  totalBrands: number;
}

const STATS = (carpets: string, brands: number) => [
  { value: carpets, label: 'Halı Çeşidi' },
  { value: `${brands}`, label: 'Marka' },
  { value: '~30 sn', label: 'Sonuç Süresi' },
];

export default function StatsStrip({ isWide, totalCarpets, totalBrands }: Props) {
  const stats = STATS(totalCarpets, totalBrands);
  const anims = useRef(stats.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      150,
      anims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true })
      )
    ).start();
  }, []);

  return (
    <View style={[
      styles.container,
      isWeb && ({
        boxShadow: '0 0 40px rgba(200, 134, 10, 0.06)',
      } as any),
    ]}>
      {stats.map((stat, i) => (
        <Animated.View
          key={stat.label}
          style={[
            styles.statItem,
            i < stats.length - 1 && styles.statDivider,
            { opacity: anims[i], transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] },
          ]}
        >
          <Text style={[styles.statValue, isWide && styles.statValueWide]}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  statDivider: {
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  statValue: {
    color: COLORS.primaryLight,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statValueWide: {
    fontSize: 36,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
