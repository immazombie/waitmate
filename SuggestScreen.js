import React from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';

export default function SuggestScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>🍽️ Suggest a Restaurant</Text>
      <TextInput
        placeholder="Restaurant name"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 10,
          marginBottom: 20,
        }}
      />
      <TextInput
        placeholder="Optional notes (address, type, etc.)"
        multiline
        numberOfLines={4}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 10,
          textAlignVertical: 'top',
          marginBottom: 20,
        }}
      />
      <TouchableOpacity
        style={{
          backgroundColor: '#007BFF',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Submit Suggestion</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}