import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Platform } from 'react-native';
import * as Location from 'expo-location';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Get dimensions safely
const getDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 };
  }
};

// Dimensions will be retrieved dynamically

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

export default function LocationDisplay({ selectedLocation }) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // If a location is selected from search, use it
    if (selectedLocation) {
      setLocation({
        coords: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          accuracy: null,
        },
      });
      opacity.value = withSpring(1, { damping: 15 });
      setLoading(false);
      setErrorMsg(null);
      return;
    }

    // Otherwise, get current GPS location
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission denied. Enable in settings.');
          setLoading(false);
          return;
        }

        try {
          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });
          setLocation(location);
          opacity.value = withSpring(1, { damping: 15 });
        } catch (error) {
          console.error('Location error:', error);
          setErrorMsg('Unable to get location. Check GPS settings.');
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error('Permission request error:', error);
        setErrorMsg('Permission request failed');
        setLoading(false);
      }
    })();
  }, [selectedLocation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const formatCoordinate = (coord) => {
    if (!coord) return '--';
    return coord.toFixed(6);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#F4C430" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.coordinateContainer}>
        <View style={styles.coordinateItem}>
          <Text style={styles.label}>Latitude</Text>
          <Text style={styles.value}>
            {formatCoordinate(location?.coords.latitude)}°
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.coordinateItem}>
          <Text style={styles.label}>Longitude</Text>
          <Text style={styles.value}>
            {formatCoordinate(location?.coords.longitude)}°
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.coordinateItem}>
          <Text style={styles.label}>Accuracy</Text>
          <Text style={styles.value}>
            {location?.coords.accuracy
              ? `${Math.round(location.coords.accuracy)}m`
              : '--'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveSize(20),
    paddingVertical: getResponsiveSize(8),
    paddingTop: getResponsiveSize(12),
    alignItems: 'center',
  },
  coordinateContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(16),
    paddingVertical: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(16),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F4C430',
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: '100%', // Use maxWidth instead of fixed width
  },
  coordinateItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0, // Allow flex shrinking
  },
  label: {
    fontSize: getResponsiveFont(9),
    color: '#8B7355',
    marginBottom: getResponsiveSize(4),
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: getResponsiveFont(13),
    color: '#B8860B',
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1.5,
    height: getResponsiveSize(30),
    backgroundColor: '#F4C430',
    marginHorizontal: getResponsiveSize(8),
    opacity: 0.4,
  },
  errorText: {
    color: '#D2691E',
    fontSize: getResponsiveFont(11),
    textAlign: 'center',
    fontWeight: '500',
  },
});
