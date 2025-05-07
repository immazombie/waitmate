import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { colors } from './theme';
import { typography } from './GlobalStyles';
import WaitMateLogo from './assets/waitmate-logo.png';

const CustomDrawer = (props) => {
  const navigation = useNavigation();

  const menuItems = [
    { label: 'Home', route: 'Home' },
    { label: 'FAQ', route: 'FAQ' },
    { label: 'All Restaurants', route: 'AllRestaurants' },
    { label: 'Profile', route: 'Profile' },
    { label: 'Submit Restaurant', route: 'SubmitRestaurant' },
  ];

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <Image source={WaitMateLogo} style={styles.logo} />

      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate(item.route);
          }}
        >
          <Text style={styles.menuText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </DrawerContentScrollView>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9f0',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  logo: {
    width: 140,
    height: 40,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#fef1dd',
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuText: {
    fontSize: 20,
    fontFamily: 'ReenieBeanie_400Regular',
    color: '#3a3a1a',
  },
});
