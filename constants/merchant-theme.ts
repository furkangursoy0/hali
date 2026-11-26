import { Platform } from 'react-native';
import { COLORS as nativeColors } from './theme';

const isWeb = Platform.OS === 'web';

export const COLORS = isWeb ? {
    ...nativeColors,
    primary: '#2458F5',
    primaryDark: '#1C46CE',
    primaryLight: '#1C46CE',
    primaryGlow: '#EEF3FF',
    primaryGlowStrong: '#D6E1FF',
    background: '#F7F9FC',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F4FA',
    surfaceGlass: 'rgba(255, 255, 255, 0.94)',
    border: '#E4EAF3',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    success: '#166534',
    error: '#B42318',
} : nativeColors;

export const merchantErrorSurface = isWeb ? '#FFF1EF' : '#2B1717';
export const merchantErrorBorder = isWeb ? '#F8C9C1' : '#6A2A2A';
