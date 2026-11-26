import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RADIUS, SPACING } from '../constants/theme';
import { COLORS, merchantErrorSurface } from '../constants/merchant-theme';

interface UsageLimitBadgeProps {
  remaining: number;
  limit: number;
  loading?: boolean;
}

export default function UsageLimitBadge({ remaining, limit, loading = false }: UsageLimitBadgeProps) {
  if (loading) {
    return (
      <View style={[styles.badge, styles.badgeLoading]}>
        <Text style={styles.label}>Kalan hak yükleniyor...</Text>
      </View>
    );
  }

  const isCritical = remaining <= 0;
  const isWarning = remaining > 0 && remaining <= 3;

  return (
    <View
      style={[
        styles.badge,
        isWarning && styles.badgeWarning,
        isCritical && styles.badgeCritical,
      ]}
    >
      <Text style={[styles.label, isCritical && styles.labelCritical]}>
        Kalan hak: {remaining}/{limit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  badgeLoading: {
    opacity: 0.8,
  },
  badgeWarning: {
    borderColor: COLORS.primary,
  },
  badgeCritical: {
    borderColor: COLORS.error,
    backgroundColor: merchantErrorSurface,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  labelCritical: {
    color: COLORS.error,
  },
});
