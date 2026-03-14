import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const isWeb = Platform.OS === 'web';

interface Props {
  isWide: boolean;
  totalCarpets: string;
  totalBrands: number;
  onLoginPress: () => void;
  onWhatsAppPress: () => void;
}

export default function HeroSection({ isWide, totalCarpets, totalBrands, onLoginPress, onWhatsAppPress }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Glow orbs */}
      <View style={[styles.glowOrb1, { pointerEvents: 'none' } as any]} />
      <View style={[styles.glowOrb2, { pointerEvents: 'none' } as any]} />

      <Text style={[styles.title, isWide && styles.titleWide]}>
        {'Müşterilerinize Halıları'}
        {'\n'}
        {isWeb ? (
          <Text style={isWide ? styles.titleAccentWide : styles.titleAccent}>Evlerinde Gösterin</Text>
        ) : (
          <Text style={styles.titleAccent}>Evlerinde Gösterin</Text>
        )}
      </Text>

      <Text style={[styles.subtitle, isWide && styles.subtitleWide]}>
        Yapay zeka ile halılarınızı müşterinizin odasına yerleştirin.{'\n'}
        Satışlarınızı artırın, iadeleri azaltın.
      </Text>

      {/* CTAs */}
      <View style={[styles.ctaRow, !isWide && styles.ctaRowMobile]}>
        <Pressable
          style={({ hovered }: any) => [styles.primaryBtn, hovered && styles.primaryBtnHover]}
          onPress={onWhatsAppPress}
        >
          <Text style={styles.primaryBtnText}>Ücretsiz Demo</Text>
        </Pressable>
        <Pressable
          style={({ hovered }: any) => [styles.ghostBtn, hovered && styles.ghostBtnHover]}
          onPress={onLoginPress}
        >
          <Text style={styles.ghostBtnText}>Giriş Yap →</Text>
        </Pressable>
      </View>

      {/* Trust line */}
      <Text style={styles.trustLine}>
        {totalCarpets} halı{'  ·  '}{totalBrands} marka{'  ·  '}Ücretsiz demo
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xl,
    position: 'relative',
  },
  glowOrb1: {
    position: 'absolute',
    top: -80,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(200, 134, 10, 0.06)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -40,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(200, 134, 10, 0.04)',
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  titleWide: {
    fontSize: 52,
    lineHeight: 62,
    letterSpacing: -1,
  },
  titleAccent: {
    color: COLORS.primaryLight,
  },
  titleAccentWide: {
    color: COLORS.primaryLight,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 24,
    maxWidth: 500,
  },
  subtitleWide: {
    fontSize: 17,
    lineHeight: 26,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  ctaRowMobile: {
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: SPACING.xl,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnHover: {
    backgroundColor: COLORS.primaryLight,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 17,
    textAlign: 'center',
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 28,
    paddingVertical: 15,
  },
  ghostBtnHover: {
    borderColor: COLORS.primaryGlowStrong,
    backgroundColor: COLORS.surfaceElevated,
  },
  ghostBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  trustLine: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: SPACING.lg,
    letterSpacing: 0.3,
  },
});
