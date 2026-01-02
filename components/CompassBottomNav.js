import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
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

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function CompassBottomNav({ onCapturePress, onLastCapturedPress, hasCapturedImage }) {
  const { t } = useI18n();
  
  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(30);
  const captureButtonScale = useSharedValue(1);
  const lastCapturedButtonScale = useSharedValue(1);
  const captureButtonGlow = useSharedValue(0);
  const lastCapturedButtonGlow = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  
  // Entrance animations
  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    containerTranslateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    
    // Staggered button animations
    captureButtonScale.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 200 }));
    lastCapturedButtonScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 200 }));
    
    // Continuous glow animations
    captureButtonGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    
    if (hasCapturedImage) {
      lastCapturedButtonGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
    
    // Subtle icon rotation
    iconRotation.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [hasCapturedImage]);
  
  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));
  
  const captureButtonAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(captureButtonGlow.value, [0, 1], [1, 1.02]);
    const shadowOpacity = interpolate(captureButtonGlow.value, [0, 1], [0.3, 0.5]);
    return {
      transform: [{ scale: captureButtonScale.value * scale }],
      shadowOpacity,
    };
  });
  
  const lastCapturedButtonAnimatedStyle = useAnimatedStyle(() => {
    if (!hasCapturedImage) return { transform: [{ scale: lastCapturedButtonScale.value }] };
    const scale = interpolate(lastCapturedButtonGlow.value, [0, 1], [1, 1.02]);
    const shadowOpacity = interpolate(lastCapturedButtonGlow.value, [0, 1], [0.3, 0.5]);
    return {
      transform: [{ scale: lastCapturedButtonScale.value * scale }],
      shadowOpacity,
    };
  });
  
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));
  
  // Button press handlers
  const handleCapturePress = () => {
    captureButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    iconRotation.value = withSequence(
      withTiming(iconRotation.value + 360, { duration: 500, easing: Easing.out(Easing.ease) }),
      withSpring(iconRotation.value + 360, { damping: 15, stiffness: 200 })
    );
    onCapturePress();
  };
  
  const handleLastCapturedPress = () => {
    if (!hasCapturedImage) return;
    lastCapturedButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onLastCapturedPress();
  };
  
  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <AnimatedTouchableOpacity
        style={[styles.buttonContainer, captureButtonAnimatedStyle]}
        onPress={handleCapturePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#F4B000', '#C88A00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.pillButton}
        >
          <AnimatedView style={iconAnimatedStyle}>
            <CameraIcon size={getResponsiveSize(18)} color="#FFFFFF" />
          </AnimatedView>
          <Text style={styles.buttonText}>{t('button.capture')}</Text>
        </LinearGradient>
      </AnimatedTouchableOpacity>

      <AnimatedTouchableOpacity
        style={[styles.buttonContainer, lastCapturedButtonAnimatedStyle]}
        onPress={handleLastCapturedPress}
        activeOpacity={0.8}
        disabled={!hasCapturedImage}
      >
        <View
          style={[styles.pillButton, styles.lastCapturedButton, !hasCapturedImage && styles.disabledButton]}
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
        </View>
      </AnimatedTouchableOpacity>
    </Animated.View>
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
    backgroundColor: '#FAFAF7', // Porcelain
    borderTopWidth: 1,
    borderTopColor: '#E9E2D6', // Sand Line
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
    shadowColor: '#F4B000', // Saffron Gold
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.25, // Soft golden glow
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 20px rgba(244, 176, 0, 0.25)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }),
  },
  lastCapturedButton: {
    backgroundColor: '#FFFFFF', // Warm White
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: getResponsiveFont(15),
    color: '#FFFFFF', // White on gold gradient
    fontWeight: '500',
    letterSpacing: 0.5,
    textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
    numberOfLines: 1,
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.7,
    ...typography.labelLarge,
  },
  lastCapturedText: {
    color: '#1F2328', // Charcoal
  },
  disabledText: {
    color: '#6B7280', // Slate
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
    borderBottomColor: '#3B2F2F', // Espresso
    borderTopWidth: 0,
    borderTopColor: 'transparent',
  },
});
