import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

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
  const anims = useRef(STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
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
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isWide && styles.sectionTitleWide]}>Nasıl Çalışır?</Text>
      <Text style={styles.sectionSubtitle}>3 adımda müşterinize sunum yapın</Text>

      <View style={[styles.stepsContainer, isWide && styles.stepsContainerWide]}>
        {/* Desktop: horizontal connector line behind steps */}
        {isWide && (
          <View style={styles.connectorLineWide} />
        )}

        {STEPS.map((step, i) => (
          <Animated.View
            key={step.num}
            style={[
              styles.stepItem,
              isWide && styles.stepItemWide,
              {
                opacity: anims[i],
                transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            {/* Number badge */}
            <View style={[
              styles.numBadge,
              isWeb && ({ boxShadow: '0 4px 20px rgba(200, 134, 10, 0.3)' } as any),
            ]}>
              <Text style={styles.emoji}>{step.emoji}</Text>
              <View style={styles.numCircle}>
                <Text style={styles.numText}>{step.num}</Text>
              </View>
            </View>

            <Text style={[styles.stepTitle, isWide && styles.stepTitleWide]}>{step.title}</Text>
            <Text style={[styles.stepDesc, isWide && styles.stepDescWide]}>{step.desc}</Text>

            {/* Mobile: vertical connector AFTER text */}
            {!isWide && i < STEPS.length - 1 && (
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
  sectionTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitleWide: {
    fontSize: 32,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  stepsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
  },
  stepsContainerWide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    gap: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  connectorLineWide: {
    position: 'absolute',
    top: 32,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: COLORS.border,
    zIndex: 0,
  },
  stepItem: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  stepItemWide: {
    flex: 1,
    maxWidth: 280,
    zIndex: 1,
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
    textAlign: 'center',
    marginBottom: 6,
  },
  stepTitleWide: {
    fontSize: 18,
  },
  stepDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 220,
  },
  stepDescWide: {
    fontSize: 14,
  },
});
