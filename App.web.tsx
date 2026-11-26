import React, { useRef, useState, type FormEvent } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { COLORS } from './constants/merchant-theme';
import AdminScreen from './screens/AdminScreen';
import HomeScreen from './screens/HomeScreen';
import SelectScreen from './screens/SelectScreen';
import ResultScreen from './screens/ResultScreen';
import './components/merchant-web.css';

const Stack = createStackNavigator();
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
  },
};

function MerchantLogin() {
  const { signIn } = useAuth();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const fields = new FormData(event.currentTarget);
    const identifier = String(fields.get('username') ?? '').trim();
    const password = String(fields.get('password') ?? '');
    if (!identifier || !password) {
      setError('Kullanıcı adınızı ve şifrenizi girin.');
      return;
    }

    setError('');
    submitting.current = true;
    setPending(true);
    try {
      const result = await signIn(identifier, password);
      if (!result.ok) setError(result.message);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <main className="merchant-page">
      <section className="merchant-login" aria-labelledby="merchant-heading">
        <div className="merchant-brand">
          <img src="/landing/halidene-mark.webp" alt="" width="40" height="29" />
          Halı Dene
        </div>
        <h1 id="merchant-heading">Mağaza girişi</h1>
        <p className="merchant-intro">Mağaza hesabınızla halı deneme ekranına erişin.</p>
        <form noValidate onSubmit={handleSubmit} aria-busy={pending}>
          <label>
            Kullanıcı adı veya e-posta
            <input name="username" autoComplete="username" autoCapitalize="none" required />
          </label>
          <label>
            Şifre
            <input name="password" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" required />
          </label>
          <button
            className="merchant-password-toggle"
            type="button"
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible(visible => !visible)}
          >
            {passwordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
          </button>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={pending}>
            {pending ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>
      </section>
    </main>
  );
}

function MerchantNavigator() {
  const { isHydrated, isLoggedIn, isAdmin } = useAuth();

  if (!isHydrated) {
    return <main className="merchant-page"><p role="status">Oturum kontrol ediliyor…</p></main>;
  }

  if (!isLoggedIn) return <MerchantLogin />;

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.background } }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Select" component={SelectScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        {isAdmin && <Stack.Screen name="Admin" component={AdminScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function MerchantApplication() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <MerchantNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
