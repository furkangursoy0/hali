import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { SPACING, RADIUS } from '../../constants/theme';
import { LANDING_COLORS as COLORS, LANDING_SHADOW } from './theme';

const isWeb = Platform.OS === 'web';

interface Props {
  isWide: boolean;
}

const STEPS = [
  { num: '1', emoji: '📸', title: 'Oda Fotoğrafı Çekin', desc: 'Müşterinizin odasını telefon kamerasıyla çekin' },
  { num: '2', emoji: '🎨', title: 'Halı Seçin', desc: 'Geniş katalogdan istediğiniz halıyı seçin' },
  { num: '3', emoji: '✨', title: 'Sonucu Gösterin', desc: 'AI halıyı odaya yerleştirir, anında paylaşın' },
];

export default function HowItWorks({ isWide }: Props) {
  const anims = useRef(STEPS.map(() => new Animated.Value(isWeb ? 1 : 0))).current;

  useEffect(() => {
    if (isWeb) return;
    const timeout = setTimeout(() => {
      Animated.stagger(
        200,
        anims.map((a) =>
          Animated.timing(a, { toValue: 1, duration: 600, useNativeDriver: true })
        )
      ).start();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={[styles.section, isWeb && styles.sectionWeb, isWide && styles.sectionWide]}>
      <Text style={[styles.sectionTitle, isWide && styles.sectionTitleWide]}>Nasıl Çalışır?</Text>
      <Text style={styles.sectionSubtitle}>3 adımda müşterinize sunum yapın</Text>

      <View style={[styles.stepsContainer, isWeb && styles.stepsContainerWeb, isWide && styles.stepsContainerWide]}>
        {STEPS.map((step, i) => (
          <Animated.View
            key={step.num}
            style={[
              styles.stepItem,
              isWeb && styles.stepCard,
              isWide && styles.stepItemWide,
              {
                opacity: anims[i],
                transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            {/* Number badge */}
            <View style={[styles.numBadge, isWeb && styles.numBadgeWeb]}>
              <Text style={styles.emoji}>{step.emoji}</Text>
              <View style={styles.numCircle}>
                <Text style={styles.numText}>{step.num}</Text>
              </View>
            </View>

            <Text style={[styles.stepTitle, isWide && styles.stepTitleWide]}>{step.title}</Text>
            <Text style={[styles.stepDesc, isWide && styles.stepDescWide]}>{step.desc}</Text>

            {/* Mobile: vertical connector AFTER text */}
            {!isWeb && i < STEPS.length - 1 && (
              <View style={styles.connectorVert}>
                <View style={styles.connectorDot} />
                <View style={styles.connectorDot} />
                <View style={styles.connectorDot} />
              </View>
            )}
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.xxl,
    width: '100%',
    paddingVertical: SPACING.xl,
  },
  sectionWeb: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.md,
  },
  sectionWide: {
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitleWide: {
    fontSize: 36,
    letterSpacing: -0.8,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: isWeb ? 16 : 15,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  stepsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
  },
  stepsContainerWeb: {
    gap: SPACING.md,
    alignItems: 'stretch',
  },
  stepsContainerWide: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  stepItem: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  stepItemWide: {
    flex: 1,
    width: 'auto',
  },
  stepCard: {
    alignItems: 'flex-start',
    maxWidth: '100%',
    padding: SPACING.lg,
    minHeight: 164,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    boxShadow: LANDING_SHADOW.card,
  },
  numBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  numBadgeWeb: {
    width: 48,
    height: 48,
    borderWidth: 0,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryGlow,
  },
  emoji: {
    fontSize: 26,
  },
  numCircle: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  connectorVert: {
    alignItems: 'center',
    gap: 4,
    marginVertical: SPACING.sm,
  },
  connectorDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: isWeb ? 'left' : 'center',
    marginBottom: 6,
  },
  stepTitleWide: {
    fontSize: 18,
  },
  stepDesc: {
    color: COLORS.textSecondary,
    fontSize: isWeb ? 16 : 14,
    lineHeight: isWeb ? 23 : 20,
    textAlign: isWeb ? 'left' : 'center',
    maxWidth: 220,
  },
  stepDescWide: {
    maxWidth: '100%',
  },
});
