import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

const isWeb = Platform.OS === 'web';

export const LANDING_FAQS = [
  {
    question: 'Halı Dene nasıl çalışır?',
    answer:
      'Kullanıcı oda fotoğrafını yükler veya çeker, katalogdan bir halı seçer ve yapay zeka kısa süre içinde halıyı odanın içine yerleştirilmiş şekilde gösterir.',
  },
  {
    question: '3D halı deneme gerçek ölçüyü gösterir mi?',
    answer:
      'Sistem görsel olarak daha gerçekçi bir yerleşim sunar. Satış öncesi karar vermeyi kolaylaştırır; kesin ölçü doğrulaması için ürün ölçüsü yine ayrıca kontrol edilmelidir.',
  },
  {
    question: 'Bu sistem mağazalar için uygun mu?',
    answer:
      'Evet. Halı mağazaları, bayiler ve satış ekipleri müşteriye daha hızlı sunum yapmak, farklı modelleri karşılaştırmak ve karar süresini kısaltmak için kullanabilir.',
  },
  {
    question: 'Sonuç ne kadar sürede oluşur?',
    answer:
      'Landing sayfasındaki mevcut akışa göre sonuçlar genellikle 20 ila 30 saniye içinde hazırlanır.',
  },
];

function WebHeading({ text, isWide }: { text: string; isWide: boolean }) {
  if (!isWeb) {
    return <Text style={[styles.title, isWide && styles.titleWide]}>{text}</Text>;
  }

  return React.createElement(
    'h2',
    { style: StyleSheet.flatten([styles.title, isWide && styles.titleWide]) as any },
    text
  );
}

export default function FaqSection({ isWide }: { isWide: boolean }) {
  if (!isWeb) {
    return (
      <View style={styles.section}>
        <WebHeading text="Sık sorulan sorular" isWide={isWide} />
        <Text style={styles.subtitle}>Halı deneme süreci hakkında en çok merak edilenler</Text>
        {LANDING_FAQS.map((item) => (
          <View key={item.question} style={styles.card}>
            <Text style={styles.question}>{item.question}</Text>
            <Text style={styles.answer}>{item.answer}</Text>
          </View>
        ))}
      </View>
    );
  }

  return React.createElement(
    'section',
    { style: StyleSheet.flatten(styles.section) as any },
    <>
      <WebHeading text="Sık sorulan sorular" isWide={isWide} />
      <Text style={styles.subtitle}>Halı deneme süreci hakkında en çok merak edilenler</Text>
      {LANDING_FAQS.map((item) =>
        React.createElement(
          'details',
          {
            key: item.question,
            style: StyleSheet.flatten(styles.card) as any,
          },
          [
            React.createElement(
              'summary',
              { key: 'summary', style: StyleSheet.flatten(styles.question) as any },
              item.question
            ),
            React.createElement(
              'p',
              { key: 'answer', style: StyleSheet.flatten(styles.answer) as any },
              item.answer
            ),
          ]
        )
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.xxl,
    width: '100%',
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  titleWide: {
    fontSize: 32,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  question: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
  answer: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
});
