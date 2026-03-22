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

  if (isWide) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.sectionTitleWide]}>Nasıl Çalışır?</Text>
        <Text style={styles.sectionSubtitle}>3 adımda müşterinize sunum yapın</Text>

        <View style={styles.stepsRowWide}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step.num}>
              <Animated.View
                style={[
                  styles.stepCardWide,
                  {
                    opacity: anims[i],
                    transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                  },
                ]}
              >
                <View style={[
                  styles.iconCircle,
                  isWeb && ({ boxShadow: '0 4px 20px rgba(200, 134, 10, 0.25)' } as any),
                ]}>
                  <Text style={styles.emoji}>{step.emoji}</Text>
                  <View style={styles.numBadge}>
                    <Text style={styles.numText}>{step.num}</Text>
                  </View>
                </View>
                <Text style={styles.stepTitleWide}>{step.title}</Text>
                <Text style={styles.stepDescWide}>{step.desc}</Text>
              </Animated.View>

              {i < STEPS.length - 1 && (
                <View style={styles.arrowWide}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  }

  // Mobile: horizontal compact cards
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Nasıl Çalışır?</Text>
      <Text style={styles.sectionSubtitle}>3 adımda müşterinize sunum yapın</Text>

      <View style={styles.stepsMobile}>
        {STEPS.map((step, i) => (
          <Animated.View
            key={step.num}
            style={[
              styles.stepCardMobile,
              isWeb && ({ boxShadow: '0 2px 12px rgba(0,0,0,0.2)' } as any),
              {
                opacity: anims[i],
                transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              },
            ]}
          >
            {/* Left: number + icon */}
            <View style={styles.mobileLeft}>
              <View style={styles.mobileNumBadge}>
                <Text style={styles.mobileNumText}>{step.num}</Text>
              </View>
              <View style={[
                styles.mobileIconCircle,
                isWeb && ({ boxShadow: '0 2px 12px rgba(200, 134, 10, 0.2)' } as any),
              ]}>
                <Text style={styles.mobileEmoji}>{step.emoji}</Text>
              </View>
            </View>

            {/* Right: text */}
            <View style={styles.mobileRight}>
              <Text style={styles.mobileTitle}>{step.title}</Text>
              <Text style={styles.mobileDesc}>{step.desc}</Text>
            </View>
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
    paddingHorizontal: SPACING.md,
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

  /* ─── DESKTOP ─── */
  stepsRowWide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: SPACING.md,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  stepCardWide: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 260,
    paddingVertical: SPACING.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  emoji: {
    fontSize: 30,
  },
  numBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  stepTitleWide: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  stepDescWide: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 200,
  },
  arrowWide: {
    paddingTop: 28,
    paddingHorizontal: 4,
  },
  arrowText: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '300',
  },

  /* ─── MOBILE ─── */
  stepsMobile: {
    gap: SPACING.md,
    alignItems: 'center',
    width: '100%',
  },
  stepCardMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    width: '100%',
    maxWidth: 400,
    gap: SPACING.md,
  },
  mobileLeft: {
    alignItems: 'center',
    gap: 6,
  },
  mobileNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileNumText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  mobileIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileEmoji: {
    fontSize: 22,
  },
  mobileRight: {
    flex: 1,
  },
  mobileTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  mobileDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
