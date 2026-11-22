import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './components/landing/web-landing.css';
import LandingScreen from './screens/LandingScreen.web';
import BlogListScreen from './screens/BlogListScreen';
import BlogPostScreen from './screens/BlogPostScreen';
import ContactScreen from './screens/ContactScreen';

const Stack = createStackNavigator();

const linking = {
  prefixes: [],
  config: {
    screens: {
      Landing: '',
      Blog: 'blog',
      BlogPost: 'blog/:slug',
      Contact: 'contact',
    },
  },
};

export default function PublicWebsite() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#0F0F0F' } }}>
          <Stack.Screen name="Landing" component={LandingScreen} options={{ title: 'Halı Dene | Yapay Zeka ile Halı Deneme' }} />
          <Stack.Screen name="Blog" component={BlogListScreen} options={{ title: 'Blog | Halı Dene' }} />
          <Stack.Screen name="BlogPost" component={BlogPostScreen} options={{ title: 'Blog | Halı Dene' }} />
          <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'İletişim | Halı Dene' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
