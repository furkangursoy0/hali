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
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
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

    html.style.backgroundColor = '#0F0F0F';
    body.style.backgroundColor = '#0F0F0F';
    html.style.overflowX = 'hidden';
    body.style.overflowX = 'hidden';
    body.style.overscrollBehaviorX = 'none';
    body.style.overscrollBehaviorY = 'none';

    if (root) {
      root.style.backgroundColor = '#0F0F0F';
      root.style.minHeight = '100dvh';
      root.style.overflowX = 'hidden';
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
