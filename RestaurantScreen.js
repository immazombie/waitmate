import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';

import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { supabase } from './supabase';

// Define typography locally (since direct import is causing issues)
const typography = {
  regular: 'BalladofaThinMan',
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
    huge: 32
  }
};

const screenWidth = Dimensions.get('window').width;

export default function RestaurantScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurant } = route.params || {};

  const [waitTime, setWaitTime] = useState('');
  const [visitType, setVisitType] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setWaitTime('');
      setVisitType(null);
    }, [])
  );

  const handleSubmit = async () => {
    const parsedWaitTime = parseInt(waitTime);

    if (!visitType || isNaN(parsedWaitTime)) {
      Alert.alert('Missing Info', 'Please enter a valid wait time and select a visit type.');
      return;
    }

    const { error, data } = await supabase.from('wait_times').insert([
      {
        restaurant_id: restaurant.id,
        wait_time: parsedWaitTime,
        visit_type: visitType,
        submitted_at: new Date().toISOString(),
      },
    ]);

    console.log('✅ Submitted to Supabase:', data);

    if (error) {
      console.error('❌ Supabase insert error:', error.message);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return;
    }

    Alert.alert('🎉 Thanks!', 'Your wait time was submitted.');
    setWaitTime('');
    setVisitType(null);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        {restaurant?.image_url && (
          <Image
            source={{ uri: restaurant.image_url }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        )}

        <Text style={styles.restaurantName}>{restaurant?.name}</Text>
        
        <View style={styles.card}>
          <Text style={styles.infoText}>
            🍽 Type: <Text style={styles.infoValue}>{restaurant?.food_type || 'Unknown'}</Text>
          </Text>
          <Text style={styles.infoText}>
            📍 Address: <Text style={styles.infoValue}>{restaurant?.address || 'Not listed'}</Text>
          </Text>
          <Text style={styles.waitText}>
            Dine In Wait: <Text style={styles.waitValue}>{restaurant?.dine_in_wait ?? 'N/A'} min</Text>
          </Text>
          <Text style={styles.waitText}>
            Take Out Wait: <Text style={styles.waitValue}>{restaurant?.take_out_wait ?? 'N/A'} min</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Submit a Wait Time</Text>
          <TextInput
            placeholder="Enter wait time (minutes)"
            value={waitTime}
            onChangeText={setWaitTime}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#999"
          />
          <DropDownPicker
            open={openDropdown}
            value={visitType}
            items={[
              { label: 'Dine In', value: 'Dine In' },
              { label: 'Take Out', value: 'Take Out' },
            ]}
            setOpen={setOpenDropdown}
            setValue={setVisitType}
            style={styles.dropdown}
            containerStyle={{ marginBottom: 16 }}
            textStyle={styles.dropdownText}
          />
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showConfetti && (
        <ConfettiCannon count={80} origin={{ x: screenWidth / 2, y: 0 }} fadeOut />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  content: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    zIndex: 10,
  },
  backArrow: {
    fontSize: 28,
    color: '#333',
    fontFamily: typography.regular,
  },
  restaurantName: {
    fontFamily: typography.regular,
    fontSize: typography.fontSize.xxl,
    color: '#333',
    marginTop: 180, // To position below the image
    marginBottom: 12,
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 180,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  infoText: { 
    fontFamily: typography.regular,
    fontSize: typography.fontSize.medium,
    color: '#555',
    marginBottom: 8,
  },
  infoValue: { 
    fontFamily: typography.regular,
    color: '#333',
  },
  waitText: { 
    fontFamily: typography.regular,
    fontSize: typography.fontSize.large,
    color: '#333',
    marginVertical: 6,
  },
  waitValue: { 
    fontFamily: typography.regular,
    color: '#007BFF',
  },
  sectionTitle: { 
    fontFamily: typography.regular,
    fontSize: typography.fontSize.xl,
    color: '#333',
    marginBottom: 16,
  },
  input: {
    fontFamily: typography.regular,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: typography.fontSize.medium,
  },
  dropdownText: {
    fontFamily: typography.regular,
    fontSize: typography.fontSize.medium,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: { 
    fontFamily: typography.regular,
    color: '#fff',
    fontSize: typography.fontSize.large,
  },
});