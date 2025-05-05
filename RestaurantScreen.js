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

  const handleSubmit = () => {
    console.log('Submitted wait time:', waitTime, 'Visit Type:', visitType);
    Alert.alert('Thanks!', 'Your wait time was submitted. 🎉');
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

    <View style={styles.card}>
      <Text style={styles.infoText}>
        🍽 Type: <Text style={styles.bold}>Unknown</Text>
      </Text>
      <Text style={styles.infoText}>
        📍 Address: <Text style={styles.bold}>Not listed</Text>
      </Text>
      <Text style={styles.waitText}>
        Dine In Wait: <Text style={styles.linkText}>{restaurant.dine_in_wait ?? 'N/A'} min</Text>
      </Text>
      <Text style={styles.waitText}>
        Take Out Wait: <Text style={styles.linkText}>{restaurant.take_out_wait ?? 'N/A'} min</Text>
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
      />
      <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>

  {/* 🎉 Confetti cannon below all content */}
  {showConfetti && (
    <ConfettiCannon count={80} origin={{ x: screenWidth / 2, y: 0 }} fadeOut />
  )}
</KeyboardAvoidingView>

  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  backButton: { paddingRight: 10 },
  backText: { fontSize: 24 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', flex: 1 },
  content: { padding: 16 },
  bannerImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
content: {
  padding: 16,
  paddingTop: Platform.OS === 'ios' ? 80 : 60,
},
  card: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
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
},
  infoText: { fontSize: 14, marginBottom: 4 },
  bold: { fontWeight: 'bold' },
  waitText: { fontSize: 16, marginVertical: 4 },
  linkText: { color: 'blue', fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: 'bold' },
});
