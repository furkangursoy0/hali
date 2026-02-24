import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn } = useAuth();
  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (submitting) return;
    const e = email.trim();
    const p = password.trim();

    if (!e || !p) {
      Alert.alert('Eksik Bilgi', 'Lütfen kullanıcı adı/e-posta ve şifre girin.');
      return;
    }
    try {
      setSubmitting(true);
      const result = await signIn(e, p);
      if (!result.ok) {
        Alert.alert('Giriş başarısız', result.message);
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.glowTop} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Geri</Text>
          </Pressable>
          <Text style={styles.kicker}>HALI</Text>
          <Text style={styles.title}>Giriş Yap</Text>
          <Text style={styles.subtitle}>Hızlı yerleştirme için hesabına giriş yap</Text>

          <View style={styles.form}>
            <View style={[styles.inputWrap, focused === 'email' && styles.inputWrapFocused]}>
              <TextInput
                style={[styles.input, isWeb && styles.inputWeb]}
                placeholder="Kullanıcı adı veya e-posta"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </View>

            <View style={[styles.inputWrap, focused === 'password' && styles.inputWrapFocused]}>
              <TextInput
                ref={passwordInputRef}
                style={[styles.input, isWeb && styles.inputWeb]}
                placeholder="Şifre"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </View>

            <Pressable
              style={({ hovered }: any) => [
                styles.loginBtn,
                hovered && styles.loginBtnHover,
                submitting && styles.loginBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={submitting}
            >
              {submitting ? (
                <View style={styles.loginBtnContent}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.loginBtnText}>Giriş yapılıyor...</Text>
                </View>
              ) : (
                <View style={styles.loginBtnContent}>
                  <Text style={styles.loginBtnText} numberOfLines={1}>
                    Giriş Yap
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: isWeb ? SPACING.lg : SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: 0,
    width: 200,
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
    justifyContent: 'center',
  },
  loginBtnHover: {
    backgroundColor: COLORS.primaryLight,
  },
  loginBtnDisabled: {
    opacity: 0.8,
  },
  loginBtnContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
