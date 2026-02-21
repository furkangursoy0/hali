import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface LimitReachedModalProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  remaining: number;
  limit: number;
}

export default function LimitReachedModal({
  visible,
  onClose,
  onBack,
  remaining,
  limit,
}: LimitReachedModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Günlük hak doldu</Text>
          <Text style={styles.message}>
            Bugün için yeni render hakkınız kalmadı. Yarın tekrar deneyebilir veya paketinizi yükseltebilirsiniz.
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Kalan: {remaining}</Text>
            <Text style={styles.metaDot}>|</Text>
            <Text style={styles.metaText}>Toplam: {limit}</Text>
          </View>
          <Pressable style={({ hovered }: any) => [styles.primaryBtn, hovered && styles.primaryBtnHover]} onPress={onBack}>
            <Text style={styles.primaryBtnText}>Geri dön</Text>
          </Pressable>
          <Pressable style={({ hovered }: any) => [styles.secondaryBtn, hovered && styles.secondaryBtnHover]} onPress={onClose}>
            <Text style={styles.secondaryBtnText}>Kapat</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    color: COLORS.textMuted,
    marginHorizontal: 8,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
    marginBottom: SPACING.xs,
  },
  primaryBtnHover: {
    backgroundColor: COLORS.primaryLight,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
  },
  secondaryBtnHover: {
    backgroundColor: COLORS.surfaceElevated,
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
});
