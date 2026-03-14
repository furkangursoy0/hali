import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const isWeb = Platform.OS === 'web';

interface Props {
  isWide: boolean;
}

const STEPS = [
  { num: '1', title: 'Oda Fotoğrafı Çekin', desc: 'Müşterinizin odasını telefon kamerasıyla çekin' },
  { num: '2', title: 'Halı Seçin', desc: 'Geniş katalogdan istediğiniz halıyı seçin' },
  { num: '3', title: 'Sonucu Gösterin', desc: 'Yapay zeka halıyı odaya yerleştirir' },
];

export default function HowItWorks({ isWide }: Props) {
  const anims = useRef(STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.stagger(
        200,
        anims.map((a) =>
          Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true })
        )
      ).start();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isWide && styles.sectionTitleWide]}>Nasıl Çalışır?</Text>
      <Text style={styles.sectionSubtitle}>3 adımda müşterinize sunum yapın</Text>

      <View style={[styles.stepsRow, !isWide && styles.stepsCol]}>
        {STEPS.map((step, i) => (
          <React.Fragment key={step.num}>
            <Animated.View
              style={[
                styles.stepCard,
                isWeb && ({
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                } as any),
                {
                  opacity: anims[i],
                  transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                },
              ]}
            >
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.num}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </Animated.View>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <View style={[styles.connector, !isWide && styles.connectorVert]}>
                <View style={[styles.connectorLine, !isWide && styles.connectorLineVert]} />
                <Text style={styles.connectorArrow}>{isWide ? '→' : '↓'}</Text>
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.xl,
    width: '100%',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitleWide: {
    fontSize: 28,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsCol: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  stepCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
  },
  stepNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  stepDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  connector: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorVert: {
    width: '100%',
    height: 32,
    flexDirection: 'column',
  },
  connectorLine: {
    width: 20,
    height: 1,
    backgroundColor: COLORS.border,
  },
  connectorLineVert: {
    width: 1,
    height: 12,
    alignSelf: 'center',
  },
  connectorArrow: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
