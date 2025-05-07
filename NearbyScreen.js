import React, { useState } from 'react';
import { View, Text, Button, FlatList, TextInput, StyleSheet } from 'react-native';
import axios from 'axios';

export default function NearbyScreen() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    try {
const res = await axios.get('http://192.168.50.48:8000/restaurants-nearby', {
  params: {
    lat: parseFloat(latitude),
    lon: parseFloat(longitude),
    radius: 10, // miles
  },
});
      setResults(res.data.restaurants);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch nearby restaurants');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Latitude"
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="Longitude"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button title="Find Nearby" onPress={handleSearch} />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text>{item.distance} miles away</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  card: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontWeight: 'bold',
  },
});
