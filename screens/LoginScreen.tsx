import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { DEMO_LOGIN } from '../constants/auth';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  const handleLogin = () => {
    const e = email.trim();
    const p = password.trim();

    if (!e || !p) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta ve şifre girin.');
      return;
    }
    if (!e.includes('@')) {
      Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta girin.');
      return;
    }
    const result = signIn(e, p);
    if (!result.ok) {
      Alert.alert('Giriş başarısız', `${result.message}\nDemo admin: ${DEMO_LOGIN.email} / ${DEMO_LOGIN.password}`);
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.glowTop} />
      <View style={styles.content}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Geri</Text>
        </Pressable>
        <Text style={styles.kicker}>HALI AI</Text>
        <Text style={styles.title}>Giriş Yap</Text>
        <Text style={styles.subtitle}>Hızlı yerleştirme için hesabına giriş yap</Text>

        <View style={styles.form}>
          <View style={[styles.inputWrap, focused === 'email' && styles.inputWrapFocused]}>
            <TextInput
              style={[styles.input, isWeb && styles.inputWeb]}
              placeholder="E-posta"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={[styles.inputWrap, focused === 'password' && styles.inputWrapFocused]}>
            <TextInput
              style={[styles.input, isWeb && styles.inputWeb]}
              placeholder="Şifre"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <Pressable style={({ hovered }: any) => [styles.loginBtn, hovered && styles.loginBtnHover]} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>Giriş Yap</Text>
          </Pressable>
          <Pressable
            style={({ hovered }: any) => [styles.demoBtn, hovered && styles.demoBtnHover]}
            onPress={() => {
              setEmail(DEMO_LOGIN.email);
              setPassword(DEMO_LOGIN.password);
            }}
          >
            <Text style={styles.demoBtnText}>Demo bilgileri doldur</Text>
          </Pressable>
          <Text style={styles.demoHint}>Demo: {DEMO_LOGIN.email} / {DEMO_LOGIN.password}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 160,
    backgroundColor: 'rgba(200, 134, 10, 0.10)',
  },
  content: {
    width: '100%',
    maxWidth: 420,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 12,
    letterSpacing: 1.1,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
  },
  inputWrapFocused: {
    borderColor: COLORS.primary,
  },
  input: {
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
  },
  inputWeb: {
    outlineStyle: 'none',
    outlineWidth: 0,
    boxShadow: 'none',
  } as any,
  loginBtn: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  loginBtnHover: {
    backgroundColor: COLORS.primaryLight,
  },
  loginBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  demoBtn: {
    marginTop: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  demoBtnHover: {
    borderColor: '#3A3A3A',
  },
  demoBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  demoHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
