import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>👤 Profile</Text>
      <Text style={{ fontSize: 16, marginTop: 10 }}>Feature coming soon!</Text>
    </SafeAreaView>
  );
}