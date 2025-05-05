import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';

export default function FAQScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <ScrollView>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>❓ FAQ</Text>
        <Text style={{ fontSize: 16, marginBottom: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>Q: What is WaitMate?</Text>{'\n'}
          A: WaitMate helps you check real-time restaurant wait times shared by the community.
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>Q: How is wait time calculated?</Text>{'\n'}
          A: It's based on user-submitted data within the last 2 hours.
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>Q: Can I submit my own wait time?</Text>{'\n'}
          A: Yes! Tap a restaurant and scroll to the bottom to submit.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}