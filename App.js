import React from 'react';
import { View, Image, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading'; // if not installed: `expo install expo-app-loading`
import { useFonts } from 'expo-font';

import HomeScreen from './HomeScreen';
import FAQScreen from './screens/FAQScreen';
import AllRestaurantsScreen from './screens/RestaurantListScreen';
import ProfileScreen from './screens/ProfileScreen';
import SubmitRestaurantScreen from './screens/SuggestScreen';

import WaitMateLogo from './assets/waitmate-logo.png';

const Drawer = createDrawerNavigator();

export const typography = {
  regular: 'BalladofaThinMan',
  body: 'ReenieBeanie',
  bold: 'System-Bold',
  medium: 'System-Medium',
  fontSize: {
    tiny: 10,
    small: 12,
    regular: 14,
    medium: 16,
    large: 18,
    xl: 22,
    xxl: 26,
    huge: 32,
  },
};

function CustomDrawerContent(props) {
  return (
    <LinearGradient colors={['#fffaf2', '#fce5d8']} style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 50 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image source={WaitMateLogo} style={{ width: 240, height: 80, resizeMode: 'contain' }} />
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </LinearGradient>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    BalladofaThinMan: require('./assets/fonts/BalladofaThinMan.ttf'),
    ReenieBeanie: require('./assets/fonts/ReenieBeanie-Regular.ttf'),
  });

  if (!fontsLoaded) return <AppLoading />;

  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: '#fff9f0',
            width: 260,
          },
          drawerLabelStyle: {
            fontFamily: 'BalladofaThinMan',
            fontSize: typography.fontSize.xl,
            color: '#3a3a1a',
          },
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="FAQ" component={FAQScreen} />
        <Drawer.Screen name="All Restaurants" component={AllRestaurantsScreen} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen name="Submit Restaurant" component={SubmitRestaurantScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
