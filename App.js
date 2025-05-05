import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import HomeScreen from './HomeScreen';
import RestaurantScreen from './RestaurantScreen';
import FAQScreen from './FAQScreen';
import ProfileScreen from './ProfileScreen';
import SuggestScreen from './SuggestScreen';

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Home">
        <Drawer.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Drawer.Screen name="Restaurant" component={RestaurantScreen} options={{ headerShown: false }} />
        <Drawer.Screen name="FAQ" component={FAQScreen} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen name="Suggest a Restaurant" component={SuggestScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}