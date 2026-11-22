import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { SPACING, RADIUS } from '../../constants/theme';
import { LANDING_COLORS as COLORS, LANDING_SHADOW } from './theme';

const isWeb = Platform.OS === 'web';

interface Props {
  isWide: boolean;
  totalCarpets: string;
  totalBrands: number;
  onLoginPress: () => void;
  onWhatsAppPress: () => void;
}

export default function HeroSection({ isWide, totalCarpets, totalBrands, onLoginPress, onWhatsAppPress }: Props) {
  const fadeAnim = useRef(new Animated.Value(isWeb ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(isWeb ? 0 : 30)).current;

  useEffect(() => {
    if (isWeb) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.hero, isWide && styles.heroWide, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={[styles.title, isWide && styles.titleWide]}>
        {'Müşterilerinize Halıları'}
        {'\n'}
        <Text style={styles.titleAccent}>Evlerinde Gösterin</Text>
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

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: isWeb ? 'flex-start' : 'center',
    paddingTop: isWeb ? SPACING.xl : SPACING.xxxl,
    paddingBottom: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  heroWide: {
    alignItems: 'flex-start',
    paddingTop: 0,
  },
  title: {
    color: COLORS.text,
    fontSize: isWeb ? 38 : 30,
    fontWeight: '800',
    textAlign: isWeb ? 'left' : 'center',
    lineHeight: isWeb ? 42 : 40,
    letterSpacing: isWeb ? -1.4 : -0.5,
  },
  titleWide: {
    fontSize: 54,
    lineHeight: 57,
    letterSpacing: -2.4,
    textAlign: 'left',
  },
  titleAccent: {
    color: isWeb ? COLORS.text : COLORS.primaryLight,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: isWeb ? 16 : 15,
    textAlign: isWeb ? 'left' : 'center',
    marginTop: SPACING.md,
    lineHeight: 24,
    maxWidth: 500,
  },
  subtitleWide: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'left',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  ctaRowMobile: {
    flexDirection: isWeb ? 'row' : 'column',
    flexWrap: 'wrap',
    width: '100%',
    paddingHorizontal: isWeb ? 0 : SPACING.xl,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: isWeb ? 22 : 32,
    paddingVertical: isWeb ? 14 : 16,
    ...(isWeb ? { boxShadow: LANDING_SHADOW.primary } : {
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    }),
  },
  primaryBtnHover: {
    backgroundColor: isWeb ? COLORS.primaryDark : COLORS.primaryLight,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: isWeb ? 15 : 17,
    textAlign: 'center',
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: isWeb ? 20 : 28,
    paddingVertical: isWeb ? 13 : 15,
  },
  ghostBtnHover: {
    borderColor: COLORS.primaryGlowStrong,
    backgroundColor: COLORS.surfaceElevated,
  },
  ghostBtnText: {
    color: isWeb ? COLORS.text : COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
