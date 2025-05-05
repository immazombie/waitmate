import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  FlatList,
  Image,
  Platform,
  Dimensions
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from './supabase';
import * as Haptics from 'expo-haptics';

const screenWidth = Dimensions.get('window').width;
const defaultImage = 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=60';

const RenderCard = ({ item, highlightedId }) => {
  const navigation = useNavigation();
  const isHighlighted = item.id === highlightedId;

  const handlePress = () => {
    Haptics.selectionAsync(); // 🎯 add this for haptic feedback
    navigation.navigate('Restaurant', { restaurant: item });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={[styles.card, isHighlighted && styles.highlightedCard]}>
        <Image source={{ uri: item.image_url || defaultImage }} style={styles.cardImage} />
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name || 'Unnamed Restaurant'}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.details}>🍽 Dine In: {item.dine_in_wait ?? 'N/A'} min</Text>
            <Text style={styles.details}>🥡 Take Out: {item.take_out_wait ?? 'N/A'} min</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const [waitTimes, setWaitTimes] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({ diningType: '', sortOrder: '' });
  const [highlightedId, setHighlightedId] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);
  const flatListRef = useRef(null);
  const navigation = useNavigation();
  const [filterVisible, setFilterVisible] = useState(false);

  const fetchWaitTimes = async () => {
    const { data, error } = await supabase
      .from('wait_times')
      .select('*, restaurants(*)')
      .order('submitted_at', { ascending: false });
    if (!error) {
      setWaitTimes(data);
      fetchAndUpdateRestaurants(data);
    }
  };

  const fetchAndUpdateRestaurants = async (waitData) => {
    const averages = {};
    waitData.forEach((entry) => {
      const dineKey = `${entry.restaurant_id}-Dine In`;
      const takeKey = `${entry.restaurant_id}-Take Out`;
      if (entry.visit_type === 'Dine In') {
        if (!averages[dineKey]) averages[dineKey] = { total: 0, count: 0 };
        averages[dineKey].total += entry.wait_time;
        averages[dineKey].count += 1;
      } else if (entry.visit_type === 'Take Out') {
        if (!averages[takeKey]) averages[takeKey] = { total: 0, count: 0 };
        averages[takeKey].total += entry.wait_time;
        averages[takeKey].count += 1;
      }
    });

    const { data: restaurantsData, error } = await supabase.from('restaurants').select('*');
    if (!error) {
      const enriched = restaurantsData.map((r) => {
        const dineKey = `${r.id}-Dine In`;
        const takeKey = `${r.id}-Take Out`;
        return {
          ...r,
          dine_in_wait: averages[dineKey] ? Math.round(averages[dineKey].total / averages[dineKey].count) : null,
          take_out_wait: averages[takeKey] ? Math.round(averages[takeKey].total / averages[takeKey].count) : null,
        };
      });
      setRestaurants(enriched);
    }
  };

  useFocusEffect(useCallback(() => { fetchWaitTimes(); }, []));

  useEffect(() => {
    let results = [...restaurants];

    if (searchQuery.trim()) {
      results = results.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterOptions.diningType === 'Dine In') {
      results = results.filter((r) => r.dine_in_wait !== null);
    } else if (filterOptions.diningType === 'Take Out') {
      results = results.filter((r) => r.take_out_wait !== null);
    }

    if (filterOptions.sortOrder === 'Shortest Wait') {
      results.sort((a, b) => {
        const aWait = filterOptions.diningType === 'Take Out' ? a.take_out_wait : a.dine_in_wait;
        const bWait = filterOptions.diningType === 'Take Out' ? b.take_out_wait : b.dine_in_wait;
        return (aWait || Infinity) - (bWait || Infinity);
      });
    } else if (filterOptions.sortOrder === 'Longest Wait') {
      results.sort((a, b) => {
        const aWait = filterOptions.diningType === 'Take Out' ? a.take_out_wait : a.dine_in_wait;
        const bWait = filterOptions.diningType === 'Take Out' ? b.take_out_wait : b.dine_in_wait;
        return (bWait || 0) - (aWait || 0);
      });
    }

    setFilteredRestaurants(results);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [restaurants, waitTimes, searchQuery, filterOptions]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#007BFF" />

        <View style={styles.header}>
          <Text style={styles.title}>🍽️ WaitMate</Text>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Text style={{ fontSize: 24 }}>☰</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search restaurants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <TouchableOpacity onPress={() => setFilterVisible(!filterVisible)} style={styles.filterButton}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Filter ⬇️</Text>
          </TouchableOpacity>
        </View>

        {filterVisible && (
          <View style={styles.filterDropdown}>
            <Text style={styles.filterLabel}>Dining Type</Text>
            <View style={styles.filterRow}>
              {['All', 'Dine In', 'Take Out'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    filterOptions.diningType === option && styles.selectedOption,
                  ]}
                  onPress={() =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      diningType: option === 'All' ? '' : option,
                    }))
                  }
                >
                  <Text style={styles.filterOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Sort By Wait</Text>
            <View style={styles.filterRow}>
              {['Shortest Wait', 'Longest Wait'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    filterOptions.sortOrder === option && styles.selectedOption,
                  ]}
                  onPress={() =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      sortOrder: prev.sortOrder === option ? '' : option,
                    }))
                  }
                >
                  <Text style={styles.filterOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

<View style={{ height: 300 }}>
  {filteredRestaurants.length > 0 && (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 43.9748,
        longitude: -75.9108,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {filteredRestaurants.map((restaurant, index) => {
        const lat = restaurant.latitude;
        const lon = restaurant.longitude;

        if (
          typeof lat !== 'number' ||
          typeof lon !== 'number' ||
          isNaN(lat) ||
          isNaN(lon)
        ) {
          return null;
        }

        const waitTime = restaurant.dine_in_wait ?? restaurant.take_out_wait;
        const color =
          waitTime > 15 ? 'red' :
          waitTime <= 10 ? 'green' : 'orange';

        return (
          <Marker
            key={index}
            coordinate={{ latitude: lat, longitude: lon }}
            onPress={() => {
              Haptics.selectionAsync(); // 🎯 haptic tap
              const listIndex = filteredRestaurants.findIndex(r => r.id === restaurant.id);
              flatListRef.current?.scrollToIndex({ index: listIndex, animated: true });
              setHighlightedId(restaurant.id);
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: color,
                borderWidth: 2,
                borderColor: '#fff',
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.7,
                shadowRadius: 4,
                elevation: 4,
              }}
            />
          </Marker>
        );
      })}
    </MapView>
  )}
</View>

        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={filteredRestaurants}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <RenderCard item={item} highlightedId={highlightedId} />}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginRight: 10,
  },
  filterButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filterDropdown: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  filterLabel: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterOption: {
    backgroundColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    marginRight: 10,
    marginBottom: 6,
  },
  selectedOption: {
    backgroundColor: '#007BFF',
  },
  filterOptionText: {
    color: 'white',
  },
  card: {
    width: screenWidth - 32,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 3,
    alignSelf: 'center',
  },
  highlightedCard: {
    borderColor: 'red',
    borderWidth: 2,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardInfo: {
    padding: 10,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#444',
  },
});
