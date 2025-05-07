import React from 'react';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';
import { ReenieBeanie_400Regular } from '@expo-google-fonts/reenie-beanie';

export default function FontLoader({ children }) {
  const [fontsLoaded] = useFonts({
    BalladofaThinMan: require('./assets/fonts/BalladofaThinMan-Regular.ttf'),
    ReenieBeanie_400Regular,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return children;
}