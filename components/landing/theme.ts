import { Platform } from 'react-native';
import { COLORS } from '../../constants/theme';

export const LANDING_COLORS = Platform.OS === 'web' ? {
  ...COLORS,
  primary: '#2458F5',
  primaryDark: '#1D4ED8',
  primaryLight: '#2458F5',
  primaryGlow: '#EFF6FF',
  primaryGlowStrong: '#B8CBFD',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',
  border: '#E4EAF3',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
} : COLORS;

export const LANDING_LAYOUT = {
  maxWidth: 1280,
  desktopGutter: 48,
  mobileGutter: 20,
};

export const LANDING_SHADOW = {
  card: '0 2px 8px rgba(15, 23, 42, 0.06)',
  preview: '0 18px 44px rgba(15, 23, 42, 0.12)',
  primary: '0 6px 16px rgba(36, 88, 245, 0.20)',
};
