import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, StatusBar, ScrollView, Alert } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface ContactScreenProps {
  navigation: any;
}

export default function ContactScreen({ navigation }: ContactScreenProps) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    if (!name.trim() || !surname.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Eksik bilgi', 'Lütfen tüm alanları doldurun.');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Geçersiz e-posta', 'Lütfen geçerli bir e-posta girin.');
      return false;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      Alert.alert('Geçersiz telefon', 'Telefon numarası en az 10 hane olmalı.');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Geri</Text>
        </Pressable>

        <Text style={styles.title}>İletişime Geç</Text>
        <Text style={styles.subtitle}>Bilgilerinizi bırakın, en kısa sürede size dönelim.</Text>

        {!submitted ? (
          <View style={styles.formCard}>
            <TextInput style={styles.input} placeholder="Ad" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Soyad" placeholderTextColor={COLORS.textMuted} value={surname} onChangeText={setSurname} />
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Telefon"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Pressable style={({ hovered }: any) => [styles.submitBtn, hovered && styles.submitBtnHover]} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Formu Gönder</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Talebiniz alındı</Text>
            <Text style={styles.successText}>Satış ekibimiz sizinle en kısa sürede iletişime geçecek.</Text>
            <Pressable style={styles.submitBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.submitBtnText}>Ana Sayfaya Dön</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xxl + SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.lg,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
  },
  submitBtn: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
  },
  submitBtnHover: {
    backgroundColor: COLORS.primaryLight,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  successCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  successTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  successText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
});
