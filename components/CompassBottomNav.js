import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CameraIcon from './icons/CameraIcon';
import LocationIcon from './icons/LocationIcon';
import { useI18n } from '../utils/i18n';
import { colors, typography, elevation } from '../utils/theme';

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

export default function CompassBottomNav({ onCapturePress, onLastCapturedPress, hasCapturedImage }) {
  const { t } = useI18n();
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={onCapturePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.primaryDark, colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.pillButton}
        >
          <CameraIcon size={getResponsiveSize(18)} color="#FFFFFF" />
          <Text style={styles.buttonText}>{t('button.capture')}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={onLastCapturedPress}
        activeOpacity={0.8}
        disabled={!hasCapturedImage}
      >
        <LinearGradient
          colors={!hasCapturedImage 
            ? [colors.outline, colors.outlineVariant, colors.outline]
            : [colors.primaryDark, colors.primary, colors.primaryLight]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.pillButton, !hasCapturedImage && styles.disabledButton]}
        >
          <View style={styles.triangleIcon}>
            <View style={styles.triangleUp} />
          </View>
          <Text 
            style={[styles.buttonText, styles.lastCapturedText, !hasCapturedImage && styles.disabledText]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.65}
          >
            {t('button.lastCaptured')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(16),
    paddingVertical: getResponsiveSize(10),
    paddingBottom: Platform.OS === 'ios' ? getResponsiveSize(26) : getResponsiveSize(14),
    backgroundColor: colors.primaryContainer,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
  },
  buttonContainer: {
    flex: 1,
    maxWidth: getResponsiveSize(160),
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(16),
    borderRadius: getResponsiveSize(25),
    gap: getResponsiveSize(8),
    ...elevation.level2,
    minHeight: getResponsiveSize(46),
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: getResponsiveFont(15),
    color: colors.onPrimary,
    fontWeight: '500',
    letterSpacing: 0.5,
    textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
    numberOfLines: 1,
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.7,
    ...typography.labelLarge,
  },
  lastCapturedText: {
    color: '#000000',
  },
  disabledText: {
    color: '#000000',
    opacity: 0.5,
  },
  // Triangle Icon for Last Captured
  triangleIcon: {
    width: getResponsiveSize(18),
    height: getResponsiveSize(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangleUp: {
    width: 0,
    height: 0,
    borderLeftWidth: getResponsiveSize(6),
    borderRightWidth: getResponsiveSize(6),
    borderBottomWidth: getResponsiveSize(10),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#000000',
    borderTopWidth: 0,
    borderTopColor: 'transparent',
  },
});
