import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, Platform, View } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import SelectScreen from './screens/SelectScreen';
import ResultScreen from './screens/ResultScreen';
import ContactScreen from './screens/ContactScreen';
import AdminScreen from './screens/AdminScreen';
import { COLORS } from './constants/theme';

const Stack = createStackNavigator();

function AppNavigator() {
  const { isLoggedIn, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={isLoggedIn ? 'auth' : 'guest'}
        initialRouteName={isLoggedIn ? 'Home' : 'Login'}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0F0F0F' },
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Halı Dene | Giriş' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Halı Dene' }} />
        <Stack.Screen name="Contact" component={ContactScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Select" component={SelectScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    html.style.height = '100%';
    html.style.overflow = 'hidden';
    html.style.backgroundColor = '#0F0F0F';

    body.style.height = '100%';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.backgroundColor = '#0F0F0F';
    (body.style as any).overscrollBehavior = 'none';
    (body.style as any).touchAction = 'pan-y';

    if (root) {
      root.style.height = '100%';
      root.style.overflow = 'hidden';
      root.style.backgroundColor = '#0F0F0F';
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
