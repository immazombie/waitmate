import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  FlatList,
  Image,
  Easing,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import MapView, { Marker, Circle } from 'react-native-maps';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from './supabase';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from './Components/GradientBackground';
import axios from 'axios';
import * as Location from 'expo-location';
import { colors } from './theme';
import WaitMateLogo from './assets/waitmate-logo.png';
import { BlurView } from 'expo-blur';
import { typography } from './GlobalStyles';

const screenWidth = Dimensions.get('window').width;
const defaultImage = 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=60';
const MILES_TO_METERS = 1609;

/**
 * GlowingPin Component
 * Displays an animated pin on the map
 */
const GlowingPin = ({ source }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image source={source} style={{ width: 36, height: 36 }} resizeMode="contain" />
    </Animated.View>
  );
};

/**
 * RenderCard Component
 * Displays a restaurant card in the list
 */
const RenderCard = ({ item }) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
    >
      <Image source={{ uri: item.image_url || defaultImage }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>{item.food_type || 'Type not set'}</Text>
        <Text style={styles.sub}>🍽 Dine In: {item.dine_in_wait ?? 'N/A'} min</Text>
        <Text style={styles.sub}>🥡 Take Out: {item.take_out_wait ?? 'N/A'} min</Text>
        {item.distance && (
          <Text style={styles.sub}>📍 Distance: {item.distance} miles</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * Radius Modal Component
 * Modal for adjusting search radius
 */
const RadiusModal = ({ 
  visible, 
  onClose, 
  radiusInMiles, 
  setRadiusInMiles, 
  onSearch, 
  searching 
}) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Adjust Search Radius</Text>

        <Text style={styles.radiusText}>
          {radiusInMiles} mile{radiusInMiles !== 1 ? 's' : ''}
        </Text>
          
        <Slider
          style={styles.slider}
          minimumValue={0.5}
          maximumValue={10}
          step={0.5}
          value={radiusInMiles}
          onValueChange={(value) => {
            setRadiusInMiles(value);
            Haptics.selectionAsync(); // light haptic when sliding
          }}
          minimumTrackTintColor="#007BFF"
          maximumTrackTintColor="#DDDDDD"
          thumbTintColor="#007BFF"
        />

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#f44336' }]}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#28a745' }]}
            onPress={onSearch}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.modalButtonText}>Find Restaurants</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default function HomeScreen() {
  // State
  const [radiusInMiles, setRadiusInMiles] = useState(1);
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    diningType: '',
    sortOrder: '',
  });
  const [mapRegion, setMapRegion] = useState(null);

  // Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const mapRef = useRef(null);

  // Helper functions
  const getPinImage = (restaurant) => {
    const waitTime = restaurant.dine_in_wait ?? restaurant.take_out_wait;
    if (waitTime > 15) return require('./assets/redpin.png');
    if (waitTime <= 10) return require('./assets/greenpin.png');
    return require('./assets/yellowpin.png');
  };

  const increaseRadius = () => {
    if (radiusInMiles < 10) {
      setRadiusInMiles(prev => Math.min(10, prev + 0.5));
      Haptics.selectionAsync();
    }
  };

  const decreaseRadius = () => {
    if (radiusInMiles > 0.5) {
      setRadiusInMiles(prev => Math.max(0.5, prev - 0.5));
      Haptics.selectionAsync();
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value) => {
    return value * Math.PI / 180;
  };

  // Data fetching
  const fetchRestaurants = async () => {
    const { data: waitData, error: waitError } = await supabase
      .from('wait_times')
      .select('*')
      .gte('submitted_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

    if (waitError) return console.error('Wait time fetch error:', waitError);

    const averages = {};
    waitData.forEach((entry) => {
      const key = `${entry.restaurant_id}-${entry.visit_type}`;
      if (!averages[key]) averages[key] = { total: 0, count: 0 };
      averages[key].total += entry.wait_time;
      averages[key].count += 1;
    });

    const { data: restaurantsData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*');

    if (restaurantError) return console.error('Restaurant fetch error:', restaurantError);

    const enriched = restaurantsData.map((r) => {
      const dineKey = `${r.id}-Dine In`;
      const takeKey = `${r.id}-Take Out`;
      
      // Calculate distance if user location exists
      let distance = null;
      if (userLocation && r.latitude && r.longitude) {
        distance = calculateDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          r.latitude, 
          r.longitude
        );
      }
      
      return {
        ...r,
        dine_in_wait: averages[dineKey]
          ? Math.round(averages[dineKey].total / averages[dineKey].count)
          : null,
        take_out_wait: averages[takeKey]
          ? Math.round(averages[takeKey].total / averages[takeKey].count)
          : null,
        distance: distance ? parseFloat(distance.toFixed(2)) : null
      };
    });

    let filtered = enriched.filter((r) => {
      // Filter by dining type if selected
      if (filterOptions.diningType === 'Dine In' && r.dine_in_wait == null) return false;
      if (filterOptions.diningType === 'Take Out' && r.take_out_wait == null) return false;
      
      // Filter by radius
      if (r.distance !== null && r.distance > radiusInMiles) return false;
      
      return true;
    });

    if (filterOptions.sortOrder === 'Shortest Wait') {
      filtered.sort((a, b) => {
        const aWait = filterOptions.diningType === 'Take Out' ? a.take_out_wait : a.dine_in_wait;
        const bWait = filterOptions.diningType === 'Take Out' ? b.take_out_wait : b.dine_in_wait;
        return (aWait ?? Infinity) - (bWait ?? Infinity);
      });
    } else if (filterOptions.sortOrder === 'Longest Wait') {
      filtered.sort((a, b) => {
        const aWait = filterOptions.diningType === 'Take Out' ? a.take_out_wait : a.dine_in_wait;
        const bWait = filterOptions.diningType === 'Take Out' ? b.take_out_wait : b.dine_in_wait;
        return (bWait ?? 0) - (aWait ?? 0);
      });
    }

    setRestaurants(filtered);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const fetchNearbyRestaurants = async () => {
    if (!userLocation) {
      Alert.alert('Error', 'Unable to determine your location. Please try again.');
      return;
    }
    
    setSearching(true);
    
    try {
      const res = await axios.get('http://192.168.50.48:8000/restaurants-nearby', {
        timeout: 10000, // 10 seconds
        params: {
          lat: userLocation.latitude,
          lon: userLocation.longitude,
          radius: radiusInMiles  // Use the current radius value
        }
      });
      
      setRestaurants(res.data.restaurants);
      
      // Provide feedback with haptics
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show toast or message about results
      const count = res.data.restaurants.length;
      if (count === 0) {
        Alert.alert('No Results', `No restaurants found within ${radiusInMiles} miles of your location.`);
      } else {
        Alert.alert('Success', `Found ${count} restaurant${count !== 1 ? 's' : ''} within ${radiusInMiles} miles of your location.`);
      }
    } catch (err) {
      console.error('Error fetching nearby restaurants:', err.message);
      Alert.alert('Oops', 'Could not fetch nearby restaurants. Please try again later.');
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSearching(false);
      setShowRadiusModal(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRestaurants();
    setRefreshing(false);
  };

  // Filter restaurants based on search query
  const filteredRestaurants = restaurants.filter(r => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (r.name && r.name.toLowerCase().includes(query)) ||
      (r.food_type && r.food_type.toLowerCase().includes(query))
    );
  });

  // Effects
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please enable location services to find restaurants near you.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);

      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  useEffect(() => {
    if (userLocation && mapRef.current) {
      // Calculate appropriate delta values based on radius
      const latDelta = radiusInMiles * 0.018;
      const longDelta = radiusInMiles * 0.018;
      
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: latDelta,
        longitudeDelta: longDelta,
      };
      
      mapRef.current.animateToRegion(newRegion, 300);
      setMapRegion(newRegion);
    }
  }, [radiusInMiles, userLocation]);

  useFocusEffect(
    useCallback(() => {
      fetchRestaurants();
    }, [filterOptions, radiusInMiles])
  );

  // Loading state
  if (!userLocation) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, fontFamily: typography.body }}>
          📍 Fetching location...
        </Text>
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }
  
  // Main render
  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Radius Modal */}
        <RadiusModal 
          visible={showRadiusModal}
          onClose={() => setShowRadiusModal(false)}
          radiusInMiles={radiusInMiles}
          setRadiusInMiles={setRadiusInMiles}
          onSearch={fetchNearbyRestaurants}
          searching={searching}
        />

        {/* Header */}
        <View style={[styles.header, { backgroundColor: '#FEEED4' }]}>
          <Image source={WaitMateLogo} style={styles.logo} />
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Text style={styles.menu}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
<TextInput
  style={[styles.searchBar, { fontFamily: typography.body }]}
  placeholder="Search restaurants"
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholderTextColor="#888"
/>
          <TouchableOpacity onPress={() => setShowFilter((prev) => !prev)} style={styles.filterButton}>
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        {showFilter && (
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
                  <Text style={[
                    styles.filterOptionText,
                    filterOptions.diningType === option && { color: 'white' }
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Sort Order</Text>
            <View style={styles.filterRow}>
              {['Shortest Wait', 'Longest Wait'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    filterOptions.sortOrder === option && styles.selectedOption,
                  ]}
                  onPress={() => {
                    setFilterOptions((prev) => ({
                      ...prev,
                      sortOrder: prev.sortOrder === option ? '' : option,
                    }));
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterOptions.sortOrder === option && { color: 'white' }
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Radius Control */}
        <View style={styles.radiusContainer}>
          <Text style={styles.radiusLabel}> {filteredRestaurants.length} nearby</Text>
          <View style={styles.radiusAdjustRow}>
            <TouchableOpacity onPress={decreaseRadius} style={styles.radiusButton}>
              <Text style={styles.radiusButtonText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.radiusDisplay}>
              {radiusInMiles} mile{radiusInMiles !== 1 ? 's' : ''}
            </Text>

            <TouchableOpacity onPress={increaseRadius} style={styles.radiusButton}>
              <Text style={styles.radiusButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={(region) => setMapRegion(region)}
          >
            {userLocation?.latitude && (
              <Circle
                center={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                radius={radiusInMiles * MILES_TO_METERS}
                strokeColor="rgba(0,122,255,0.5)"
                fillColor="rgba(0,122,255,0.2)"
              />
            )}

            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              pinColor="blue"
              title="You are here"
            />

            {filteredRestaurants.map((r, index) => (
              <Marker
                key={index}
                coordinate={{ latitude: r.latitude, longitude: r.longitude }}
                onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
              >
                <GlowingPin source={getPinImage(r)} />
              </Marker>
            ))}
          </MapView>

          {/* Blur effects for map edges */}
          <BlurView intensity={10} tint="light" style={styles.blurTop} />
          <BlurView intensity={10} tint="light" style={styles.blurBottom} />
          <BlurView intensity={10} tint="light" style={styles.blurLeft} />
          <BlurView intensity={10} tint="light" style={styles.blurRight} />
        </View>
 
        {/* Restaurant List */}
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          {searching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007BFF" />
              <Text style={styles.loadingText}>Finding restaurants...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRestaurants}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <RenderCard item={item} />}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No restaurants found</Text>
                  <Text style={styles.emptySubText}>
                    Try increasing your search radius or adjusting your filters
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setShowRadiusModal(true)}
                  >
                    <Text style={styles.emptyButtonText}>Adjust Search Radius</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  header: {
    backgroundColor: colors.beige,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menu: {
    fontSize: 45,
    color: '#333',
    fontFamily: typography.body,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    marginRight: 8,
    fontFamily: 'ReenieBeanie_Regular',
    fontSize: 25,
  },
  filterButton: {
    backgroundColor: '#EFE1C3',
    padding: 10,
    borderRadius: 10,
  },
  filterText: {
    color: '#000',
    fontSize: 20,
    fontFamily: typography.body,
  },
  radiusContainer: {
    backgroundColor: '#fffaf2',
    borderRadius: 16,
    paddingVertical: 2,
    paddingHorizontal: 20,
    marginHorizontal: 100,
    marginTop: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  radiusLabel: {
    fontFamily: typography.body,
    fontSize: 22,
    marginBottom: 6,
    color: '#3a3a1a',
  },
  radiusAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusButton: {
    backgroundColor: '#fde0c6',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 1,
    marginHorizontal: 10,
    elevation: 2,
  },
  radiusButtonText: {
    fontSize: 19,
    color: '#333',
    fontFamily: typography.regular,
  },
  radiusDisplay: {
    fontSize: 20,
    fontFamily: typography.regular,
    color: '#3a3a1a',
  },
  mapWrapper: {
    position: 'relative',
    height: 300,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
  },
  map: {
    flex: 1,
  },
  blurTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
  },
  blurBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 18,
  },
  blurLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 20,
  },
  blurRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 20,
  },
  filterDropdown: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 12,
    width: '100%',
  },
  filterOption: {
    backgroundColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  selectedOption: {
    backgroundColor: colors.accent,
    transform: [{ scale: 1.05 }],
  },
  filterOptionText: {
    color: '#333',
    fontFamily: typography.regular,
  },
  filterLabel: {
    fontSize: 18,
    marginBottom: 4,
    fontFamily: typography.regular,
  },
  card: {
    backgroundColor: '#fffaf7',
    borderRadius: 16,
    marginHorizontal: 1,
    marginBottom: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: screenWidth - 80,
    height: 170,
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 40,
    marginBottom: 4,
    color: '#2f2f2f',
    fontFamily: typography.regular,
  },
  sub: {
    fontSize: 23,
    color: colors.accent,
    fontFamily: typography.body,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 30,
    marginBottom: 20,
    color: '#333',
    fontFamily: typography.regular,
  },
  radiusText: {
    fontSize: 25,
    marginBottom: 10,
    color: '#007BFF',
    fontFamily: typography.regular,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: colors.accent,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 20,
    fontFamily: typography.regular,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 20,
    marginTop: 10,
    color: '#555',
    fontFamily: typography.regular,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
    fontFamily: typography.regular,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: typography.regular,
  },
  emptyButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: typography.regular,
  },
  logo: {
    width: 140,
    height: 40,
    resizeMode: 'contain',
  },
});
