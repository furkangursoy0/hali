import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

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
    backgroundColor: 'rgba(15, 15, 15, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  navInner: {
    maxWidth: 1060,
    width: '100%',
    alignSelf: 'center',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  logoBadge: {
    marginLeft: 6,
    backgroundColor: 'rgba(200, 134, 10, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(200, 134, 10, 0.45)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  logoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  navGhostBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navGhostBtnHover: {
    borderColor: COLORS.primaryGlowStrong,
    backgroundColor: COLORS.surfaceElevated,
  },
  navGhostBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  navPrimaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  navPrimaryBtnHover: {
    backgroundColor: COLORS.primaryLight,
  },
  navPrimaryBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
