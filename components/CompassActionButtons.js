import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import LocationIcon from './icons/LocationIcon';
import CameraIcon from './icons/CameraIcon';
import { useI18n } from '../utils/i18n';

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

const getCardinalDirection = (degree) => {
  if (degree >= 337.5 || degree < 22.5) return 'N';
  if (degree >= 22.5 && degree < 67.5) return 'NE';
  if (degree >= 67.5 && degree < 112.5) return 'E';
  if (degree >= 112.5 && degree < 157.5) return 'SE';
  if (degree >= 157.5 && degree < 202.5) return 'S';
  if (degree >= 202.5 && degree < 247.5) return 'SW';
  if (degree >= 247.5 && degree < 292.5) return 'W';
  if (degree >= 292.5 && degree < 337.5) return 'NW';
  return 'N';
};

export default function CompassActionButtons({ onMapPress, onCameraPress, heading }) {
  const { t } = useI18n();
  const degree = Math.round(heading);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onMapPress}
        activeOpacity={0.8}
      >
        <View style={styles.buttonCircle}>
          <LocationIcon size={getResponsiveSize(22)} color="#FFFFFF" />
        </View>
        <Text style={styles.buttonLabel}>{t('button.googleMap')}</Text>
      </TouchableOpacity>

      <View style={styles.degreeContainer}>
        <View style={styles.degreeBox}>
          <Text style={styles.degreeTitle}>{t('direction.title')}</Text>
          <View style={styles.degreeMainInfo}>
            <Text style={styles.degreeDirection}>{getCardinalDirection(degree)}</Text>
            <View style={styles.degreeDivider} />
            <Text style={styles.degreeValue}>{degree}°</Text>
          </View>
          <Text style={styles.degreeSecondary}>{getCardinalDirection(degree)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onCameraPress}
        activeOpacity={0.8}
      >
        <View style={styles.buttonCircle}>
          <CameraIcon size={getResponsiveSize(22)} color="#FFFFFF" />
        </View>
        <Text style={styles.buttonLabel}>{t('button.rearCamera')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSize(15),
    paddingVertical: getResponsiveSize(8), // Increased from 6 to 8
  },
  actionButton: {
    alignItems: 'center',
    gap: getResponsiveSize(4),
  },
  buttonCircle: {
    width: getResponsiveSize(50), // Increased from 46 to 50
    height: getResponsiveSize(50), // Increased from 46 to 50
    borderRadius: getResponsiveSize(25), // Increased from 23 to 25
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonLabel: {
    fontSize: getResponsiveFont(12), // Increased from 11 to 12
    color: '#8B7355',
    fontWeight: '700',
    marginTop: getResponsiveSize(4), // Increased from 3 to 4
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    letterSpacing: 0.3,
  },
  degreeContainer: {
    alignItems: 'center',
  },
  degreeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(8),
    borderWidth: 1.5,
    borderColor: '#F4C430',
    paddingVertical: getResponsiveSize(6), // Increased from 5 to 6
    paddingHorizontal: getResponsiveSize(16), // Increased from 14 to 16
    minWidth: getResponsiveSize(150), // Increased from 140 to 150
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#F4C430',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  degreeTitle: {
    fontSize: getResponsiveFont(10), // Increased from 9 to 10
    color: '#666666',
    fontWeight: '900',
    letterSpacing: 1.2, // Increased from 1.1 to 1.2
    textTransform: 'uppercase',
    marginBottom: getResponsiveSize(5), // Increased from 4 to 5
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  degreeMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(2), // Increased from 1.5 to 2
  },
  degreeDirection: {
    fontSize: getResponsiveFont(20), // Increased from 19 to 20
    fontWeight: '700',
    color: '#F4C430',
    letterSpacing: 0.7,
  },
  degreeDivider: {
    width: 1.5,
    height: getResponsiveSize(22), // Increased from 20 to 22
    backgroundColor: '#F4C430',
    marginHorizontal: getResponsiveSize(10), // Increased from 9 to 10
    borderRadius: 1,
  },
  degreeValue: {
    fontSize: getResponsiveFont(20), // Increased from 19 to 20
    fontWeight: '700',
    color: '#F4C430',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  degreeSecondary: {
    fontSize: getResponsiveFont(10), // Increased from 9 to 10
    color: '#666666',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

