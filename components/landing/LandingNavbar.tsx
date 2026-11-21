import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SPACING, RADIUS } from '../../constants/theme';
import { LANDING_COLORS as COLORS, LANDING_LAYOUT, LANDING_SHADOW } from './theme';

const isWeb = Platform.OS === 'web';

interface Props {
  isWide: boolean;
  onLoginPress: () => void;
  onWhatsAppPress: () => void;
  onBlogPress?: () => void;
}

export default function LandingNavbar({ isWide, onLoginPress, onWhatsAppPress, onBlogPress }: Props) {
  return (
    <View style={[
      styles.navbar,
      isWide && styles.navbarWide,
      isWeb && ({
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      } as any),
    ]}>
      <View style={styles.navInner}>
        {/* Logo */}
        <View style={styles.brandRow}>
          <Text style={styles.logo}>HALI</Text>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>DENE</Text>
          </View>
        </View>

        {/* Right buttons */}
        <View style={styles.navRight}>
          {isWide && onBlogPress && (
            <Pressable
              style={({ hovered }: any) => [styles.navGhostBtn, hovered && styles.navGhostBtnHover]}
              onPress={onBlogPress}
            >
              <Text style={styles.navGhostBtnText}>Blog</Text>
            </Pressable>
          )}
          {isWide && (
            <Pressable
              style={({ hovered }: any) => [styles.navGhostBtn, hovered && styles.navGhostBtnHover]}
              onPress={onWhatsAppPress}
            >
              <Text style={styles.navGhostBtnText}>Demo Talep Et</Text>
            </Pressable>
          )}
          <Pressable
            style={({ hovered }: any) => [styles.navPrimaryBtn, hovered && styles.navPrimaryBtnHover]}
            onPress={onLoginPress}
          >
            <Text style={styles.navPrimaryBtnText}>{isWide ? 'Giriş Yap' : 'Giriş'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: isWeb ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 15, 15, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: isWeb ? LANDING_LAYOUT.mobileGutter : SPACING.md,
  },
  navbarWide: {
    paddingHorizontal: LANDING_LAYOUT.desktopGutter,
  },
  navInner: {
    maxWidth: isWeb ? LANDING_LAYOUT.maxWidth : 1060,
    width: '100%',
    alignSelf: 'center',
    height: isWeb ? 72 : 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: isWeb ? 22 : 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: isWeb ? -0.8 : 0.5,
  },
  logoBadge: {
    marginLeft: 6,
    backgroundColor: isWeb ? COLORS.primary : 'rgba(200, 134, 10, 0.16)',
    borderWidth: 1,
    borderColor: isWeb ? COLORS.primary : 'rgba(200, 134, 10, 0.45)',
    borderRadius: 6,
    paddingHorizontal: isWeb ? 7 : 6,
    paddingVertical: isWeb ? 4 : 1,
  },
  logoBadgeText: {
    fontSize: isWeb ? 11 : 9,
    fontWeight: '800',
    color: isWeb ? COLORS.white : COLORS.primaryLight,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  navGhostBtn: {
    borderWidth: isWeb ? 0 : 1,
    borderColor: COLORS.border,
    borderRadius: isWeb ? RADIUS.full : RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: isWeb ? 10 : 8,
  },
  navGhostBtnHover: {
    borderColor: COLORS.primaryGlowStrong,
    backgroundColor: COLORS.surfaceElevated,
  },
  navGhostBtnText: {
    color: COLORS.textSecondary,
    fontSize: isWeb ? 14 : 13,
    fontWeight: '600',
  },
  navPrimaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 18,
    paddingVertical: isWeb ? 11 : 8,
    ...(isWeb && { boxShadow: LANDING_SHADOW.primary }),
  },
  navPrimaryBtnHover: {
    backgroundColor: isWeb ? COLORS.primaryDark : COLORS.primaryLight,
  },
  navPrimaryBtnText: {
    color: COLORS.white,
    fontSize: isWeb ? 14 : 13,
    fontWeight: '700',
  },
});
