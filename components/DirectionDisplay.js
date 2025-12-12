import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const getDirectionName = (degree) => {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(degree / 22.5) % 16;
  return directions[index];
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

export default function DirectionDisplay({ heading }) {
  const { t } = useI18n();
  const direction = getDirectionName(heading);
  const cardinalDirection = getCardinalDirection(heading);
  const degree = Math.round(heading);

  return (
    <View style={styles.container}>
      <View style={styles.directionBox}>
        {/* Title */}
        <Text style={styles.title}>{t('direction.title')}</Text>
        
        {/* Main Directional Information */}
        <View style={styles.mainInfo}>
          <Text style={styles.directionText}>{cardinalDirection}</Text>
          <View style={styles.divider} />
          <Text style={styles.degreeText}>{degree}°</Text>
        </View>
        
        {/* Secondary Directional Information */}
        <Text style={styles.secondaryDirection}>{cardinalDirection}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveSize(20),
    paddingVertical: getResponsiveSize(8),
    alignItems: 'center',
  },
  directionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(12),
    borderWidth: 1.5,
    borderColor: '#F4C430',
    paddingVertical: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(20),
    minWidth: getResponsiveSize(200),
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#F4C430',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: getResponsiveFont(10),
    color: '#666666',
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: getResponsiveSize(10),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(4),
  },
  directionText: {
    fontSize: getResponsiveFont(30),
    fontWeight: '900',
    color: '#F4C430',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    textShadow: '0px 2px 4px rgba(244, 196, 48, 0.3)',
  },
  divider: {
    width: 2,
    height: getResponsiveSize(28),
    backgroundColor: '#F4C430',
    marginHorizontal: getResponsiveSize(12),
    borderRadius: 1,
  },
  degreeText: {
    fontSize: getResponsiveFont(28),
    fontWeight: '700',
    color: '#F4C430',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  secondaryDirection: {
    fontSize: getResponsiveFont(12),
    color: '#666666',
    fontWeight: '700',
    letterSpacing: 0.6,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
});
