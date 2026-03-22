import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

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
          <Animated.View
            key={step.num}
            style={[
              styles.stepItem,
              isWide && styles.stepItemWide,
              {
                opacity: anims[i],
                transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }],
              },
            ]}
          >
            <View style={[styles.stepNum, isWide && styles.stepNumWide]}>
              <Text style={styles.stepNumText}>{step.num}</Text>
            </View>
            <Text style={[styles.stepTitle, isWide && styles.stepTitleWide]}>{step.title}</Text>
            <Text style={styles.stepDesc}>{step.desc}</Text>
          </Animated.View>
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
    justifyContent: 'space-between',
  },
  stepsCol: {
    flexDirection: 'column',
    gap: SPACING.lg,
  },
  stepItem: {
    flexDirection: 'column',
  },
  stepItemWide: {
    flex: 1,
    alignItems: 'center',
  },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumWide: {
    alignSelf: 'center',
  },
  stepNumText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepTitleWide: {
    textAlign: 'center',
  },
  stepDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
