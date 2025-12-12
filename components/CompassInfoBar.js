import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { useI18n } from '../utils/i18n';
import { colors, typography } from '../utils/theme';

// Get dimensions safely
const getDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 };
  }
};

const getResponsiveSize = (size) => {
  const { width } = getDimensions();
  if (!width || width === 0) return size;
  
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
  
  if (Platform.OS === 'web') {
    const effectiveWidth = Math.min(width, 600);
    const scale = effectiveWidth / 375;
    return Math.max(size * scale, size * 0.85);
  }
  
  const scale = width / 375;
  return Math.max(size * scale, size * 0.85);
};

export default function CompassInfoBar({ selectedLocation }) {
  const { t } = useI18n();
  const [location, setLocation] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [magneticField, setMagneticField] = useState(null);

  useEffect(() => {
    // Check location permission
    (async () => {
      try {
        // Web: Use browser geolocation API
        if (Platform.OS === 'web') {
          if ('geolocation' in navigator) {
            // Request location to check permission
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setHasPermission(true);
                setLocation({
                  coords: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  },
                });
              },
              (error) => {
                console.log('Web geolocation error:', error);
                setHasPermission(false);
              }
            );
          } else {
            setHasPermission(false);
          }
        } else {
          // Native: Use expo-location
          let { status } = await Location.getForegroundPermissionsAsync();
          setHasPermission(status === 'granted');
          
          if (status === 'granted') {
            try {
              let loc = await Location.getCurrentPositionAsync();
              setLocation(loc);
            } catch (error) {
              console.log('Location error:', error);
            }
          }
        }
      } catch (error) {
        console.log('Permission check error:', error);
      }
    })();

    // Get magnetic field strength
    let subscription = null;
    try {
      if (Magnetometer.isAvailableAsync) {
        Magnetometer.isAvailableAsync().then((isAvailable) => {
          if (isAvailable) {
            subscription = Magnetometer.addListener((data) => {
              const { x, y, z } = data;
              const strength = Math.sqrt(x * x + y * y + z * z);
              setMagneticField(strength * 1000); // Convert to microtesla (µT)
            });
            Magnetometer.setUpdateInterval(1000);
          }
        });
      }
    } catch (error) {
      console.log('Magnetometer error:', error);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [selectedLocation]);

  const handlePermissionClick = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, request location permission
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setHasPermission(true);
              setLocation({
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                },
              });
            },
            (error) => {
              console.log('Web geolocation error:', error);
              // Show user-friendly message
              if (error.code === 1) {
                alert('Location access denied. Please enable location access in your browser settings:\n\n1. Click the lock icon in the address bar\n2. Allow location access\n3. Refresh the page');
              } else if (error.code === 2) {
                alert('Location unavailable. Please check your device location settings.');
              } else {
                alert('Unable to get location. Please try again.');
              }
            },
            { enableHighAccuracy: true }
          );
        } else {
          alert('Geolocation is not supported by your browser.');
        }
      } else if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else if (Platform.OS === 'android') {
        await Linking.openSettings();
      }
    } catch (error) {
      console.log('Error opening settings:', error);
    }
  };

  const formatCoordinate = (coord) => {
    if (!coord) return '--';
    return coord.toFixed(6);
  };

  const displayLocation = selectedLocation || location;

  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabelCompact}>{t('info.geoCoordinate')}: </Text>
        {!hasPermission && !displayLocation ? (
          <TouchableOpacity
              style={styles.permissionWarningCompact}
            onPress={handlePermissionClick}
            activeOpacity={0.7}
          >
              <Text style={styles.warningIconCompact}>⚠️</Text>
              <Text style={styles.warningTextCompact}>{t('info.locationPermission')}</Text>
          </TouchableOpacity>
        ) : displayLocation ? (
            <Text style={styles.coordinateTextCompact} numberOfLines={1}>
            {formatCoordinate(displayLocation.coords?.latitude || displayLocation.latitude)}, {formatCoordinate(displayLocation.coords?.longitude || displayLocation.longitude)}
          </Text>
        ) : (
            <Text style={styles.coordinateTextCompact}>--, --</Text>
        )}
      </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabelCompact}>{t('info.magneticField')}: </Text>
          <Text style={styles.magneticValueCompact}>
            {magneticField ? `${Math.round(magneticField)} µT` : '-- µT'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSize(12),
    paddingVertical: getResponsiveSize(10),
    backgroundColor: colors.primaryContainer,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  infoRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: getResponsiveSize(8),
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  infoLabelCompact: {
    fontSize: getResponsiveFont(11),
    color: colors.primaryDark,
    fontWeight: '500',
    letterSpacing: 0.3,
    ...typography.labelMedium,
  },
  permissionWarningCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(2), // Reduced from 4
    flex: 1,
  },
  warningIconCompact: {
    fontSize: getResponsiveFont(12), // Increased from 11 to 12
  },
  warningTextCompact: {
    fontSize: getResponsiveFont(11),
    color: colors.error,
    fontWeight: '500',
    ...typography.labelMedium,
    flex: 1,
  },
  coordinateTextCompact: {
    fontSize: getResponsiveFont(11),
    color: colors.onSurfaceVariant,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontWeight: '400',
    ...typography.bodySmall,
    flex: 1,
  },
  magneticValueCompact: {
    fontSize: getResponsiveFont(11),
    color: colors.error,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    ...typography.labelMedium,
  },
});

