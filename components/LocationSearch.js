import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import SearchIcon from './icons/SearchIcon';
import LocationIcon from './icons/LocationIcon';
import { useI18n } from '../utils/i18n';

// Get dimensions safely
const getDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 };
  }
};

// Responsive sizing - called dynamically
const getResponsiveSize = (size) => {
  const { width } = getDimensions();
  if (!width || width === 0) return size;
  
  // For web/large screens, cap the scaling
  if (Platform.OS === 'web') {
    const effectiveWidth = Math.min(width, 600);
    const scale = effectiveWidth / 375;
    return Math.max(size * scale, size * 0.8);
  }
  
  const scale = width / 375;
  return Math.max(size * scale, size * 0.8);
};

const getResponsiveFont = (size) => {
  const { width } = getDimensions();
  if (!width || width === 0) return size;
  
  // For web/large screens, cap the scaling
  if (Platform.OS === 'web') {
    const effectiveWidth = Math.min(width, 600);
    const scale = effectiveWidth / 375;
    return Math.max(size * scale, size * 0.85);
  }
  
  const scale = width / 375;
  return Math.max(size * scale, size * 0.85);
};

export default function LocationSearch({ onLocationSelect }) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  const fetchSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'VastuCompass/1.0',
        },
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const formattedSuggestions = data.map((result) => {
          const address = result.address || {};
          const addressParts = [];
          
          if (address.house_number) addressParts.push(address.house_number);
          if (address.road) addressParts.push(address.road);
          if (address.neighbourhood) addressParts.push(address.neighbourhood);
          if (address.city || address.town || address.village) {
            addressParts.push(address.city || address.town || address.village);
          }
          if (address.state) addressParts.push(address.state);
          if (address.country) addressParts.push(address.country);
          
          const fullAddress = addressParts.length > 0 
            ? addressParts.join(', ') 
            : result.display_name;

          return {
            name: result.display_name.split(',')[0] || result.display_name,
            address: fullAddress,
            fullAddress: result.display_name,
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            placeId: result.place_id,
          };
        });
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setShowSuggestions(false);
    setSearching(true);
    setShowResults(true);

    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=10&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'VastuCompass/1.0',
        },
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const formattedResults = data.map((result) => {
          const address = result.address || {};
          const addressParts = [];
          
          if (address.house_number) addressParts.push(address.house_number);
          if (address.road) addressParts.push(address.road);
          if (address.neighbourhood) addressParts.push(address.neighbourhood);
          if (address.city || address.town || address.village) {
            addressParts.push(address.city || address.town || address.village);
          }
          if (address.state) addressParts.push(address.state);
          if (address.country) addressParts.push(address.country);
          
          const fullAddress = addressParts.length > 0 
            ? addressParts.join(', ') 
            : result.display_name;

          return {
            name: result.display_name.split(',')[0] || result.display_name,
            address: fullAddress,
            fullAddress: result.display_name,
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            placeId: result.place_id,
          };
        });
        setResults(formattedResults);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search locations. Please check your internet connection and try again.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search for suggestions
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300); // 300ms delay
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectLocation = (location) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
    setSearchQuery(location.name);
    setShowResults(false);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    handleSelectLocation(suggestion);
  };

  const handleUseCurrentLocation = async () => {
    try {
      // For web, use browser's geolocation API
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          Alert.alert('Error', 'Geolocation is not supported by your browser');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (onLocationSelect) {
              const { t } = require('../utils/i18n').useI18n();
              onLocationSelect({
                name: t('info.currentLocation'),
                address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            Alert.alert('Error', 'Failed to get current location. Please allow location access.');
          },
          { enableHighAccuracy: true }
        );
        return;
      }

      // For native platforms
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (onLocationSelect) {
        onLocationSelect({
          name: t('info.currentLocation'),
          address: `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Current location error:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Search location..."
            placeholderTextColor="#8B7355"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow tap
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView 
                style={styles.suggestionsList}
                keyboardShouldPersistTaps="handled"
              >
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={suggestion.placeId || index}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionSelect(suggestion)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionIconContainer}>
                      <LocationIcon size={getResponsiveSize(14)} color="#F4C430" />
                    </View>
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionName} numberOfLines={1}>
                        {suggestion.name}
                      </Text>
                      <Text style={styles.suggestionAddress} numberOfLines={1}>
                        {suggestion.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <SearchIcon size={getResponsiveSize(18)} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={handleUseCurrentLocation}
      >
        <LinearGradient
          colors={['#F4C430', '#FFD700', '#F4C430']}
          style={[styles.currentLocationGradient, { pointerEvents: 'none' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.currentLocationContent, { pointerEvents: 'none' }]}>
            <LocationIcon size={getResponsiveSize(16)} color="#FFFFFF" />
            <Text style={styles.currentLocationText}>{t('info.useCurrentLocation')}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <ScrollView style={styles.resultsList}>
            {results.map((result, index) => (
              <TouchableOpacity
                key={result.placeId || index}
                style={styles.resultItem}
                onPress={() => handleSelectLocation(result)}
                activeOpacity={0.7}
              >
                <View style={styles.resultIconContainer}>
                  <LocationIcon size={getResponsiveSize(16)} color="#F4C430" />
                </View>
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultName} numberOfLines={1}>{result.name}</Text>
                  <Text style={styles.resultAddress} numberOfLines={2}>{result.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {showResults && results.length === 0 && !searching && searchQuery.trim() && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No results found</Text>
          <Text style={styles.noResultsHint}>
            Try a different search term or use current location
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveSize(20),
    paddingVertical: getResponsiveSize(8),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSize(8),
    zIndex: 10,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
    marginRight: getResponsiveSize(8),
    zIndex: 10,
  },
  input: {
    height: getResponsiveSize(48),
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(14),
    paddingHorizontal: getResponsiveSize(18),
    fontSize: getResponsiveFont(15),
    color: '#2C2C2C',
    borderWidth: 2.5,
    borderColor: '#F4C430',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontWeight: '500',
    elevation: 2,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: getResponsiveSize(48),
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(12),
    borderWidth: 2,
    borderColor: '#F4C430',
    maxHeight: getResponsiveSize(200),
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: getResponsiveSize(60), // Add space to prevent overlap with button below
  },
  suggestionsList: {
    maxHeight: getResponsiveSize(200),
  },
  suggestionItem: {
    flexDirection: 'row',
    padding: getResponsiveSize(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    alignItems: 'center',
  },
  suggestionIconContainer: {
    marginRight: getResponsiveSize(10),
    width: getResponsiveSize(28),
    height: getResponsiveSize(28),
    borderRadius: getResponsiveSize(14),
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: getResponsiveFont(14),
    fontWeight: '700',
    color: '#B8860B',
    marginBottom: getResponsiveSize(3),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  suggestionAddress: {
    fontSize: getResponsiveFont(12),
    color: '#8B7355',
    fontWeight: '400',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  searchButton: {
    width: getResponsiveSize(48),
    height: getResponsiveSize(48),
    borderRadius: getResponsiveSize(14),
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchButtonText: {
    fontSize: getResponsiveFont(18),
  },
  currentLocationButton: {
    borderRadius: getResponsiveSize(14),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  currentLocationGradient: {
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(16),
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  currentLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8),
  },
  currentLocationText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFont(14),
    fontWeight: '700',
    letterSpacing: 0.6,
    textShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  resultsContainer: {
    marginTop: getResponsiveSize(8),
    maxHeight: getResponsiveSize(200),
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(12),
    borderWidth: 1,
    borderColor: '#F4C430',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  resultsList: {
    maxHeight: getResponsiveSize(200),
  },
  resultItem: {
    flexDirection: 'row',
    padding: getResponsiveSize(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    alignItems: 'center',
  },
  resultIconContainer: {
    marginRight: getResponsiveSize(12),
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    borderRadius: getResponsiveSize(16),
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: getResponsiveFont(15),
    fontWeight: '700',
    color: '#B8860B',
    marginBottom: getResponsiveSize(4),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  resultAddress: {
    fontSize: getResponsiveFont(12),
    color: '#8B7355',
    lineHeight: getResponsiveFont(18),
    fontWeight: '400',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  noResults: {
    padding: getResponsiveSize(16),
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: getResponsiveFont(14),
    color: '#8B7355',
    marginBottom: getResponsiveSize(4),
  },
  noResultsHint: {
    fontSize: getResponsiveFont(11),
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

