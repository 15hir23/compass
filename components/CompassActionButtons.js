import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
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

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function CompassActionButtons({ onMapPress, heading }) {
  const { t } = useI18n();
  // Show 0 instead of 360 for North
  const degree = Math.round(heading) % 360;
  
  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(30);
  const mapButtonScale = useSharedValue(1);
  const degreeBoxScale = useSharedValue(1);
  const degreeBoxGlow = useSharedValue(0);
  const degreePulse = useSharedValue(0);
  const [prevDegree, setPrevDegree] = React.useState(degree);
  
  // Entrance animations
  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    containerTranslateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    
    // Staggered button animations
    mapButtonScale.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 200 }));
    degreeBoxScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 200 }));
    
    // Continuous subtle glow for degree box
    degreeBoxGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    
    // Continuous pulse for degree value
    degreePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  
  // Pulse animation when degree changes
  useEffect(() => {
    if (degree !== prevDegree) {
      degreePulse.value = withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) })
      );
      degreeBoxScale.value = withSequence(
        withTiming(1.05, { duration: 150, easing: Easing.out(Easing.ease) }),
        withSpring(1, { damping: 12, stiffness: 250 })
      );
      setPrevDegree(degree);
    }
  }, [degree]);
  
  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));
  
  const mapButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mapButtonScale.value }],
  }));
  
  const degreeBoxAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(degreeBoxGlow.value, [0, 1], [1, 1.02]);
    const shadowOpacity = interpolate(degreeBoxGlow.value, [0, 1], [0.2, 0.4]);
    return {
      transform: [{ scale: degreeBoxScale.value * scale }],
      shadowOpacity,
    };
  });
  
  const degreeValueAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(degreePulse.value, [0, 1], [1, 1.1]);
    return {
      transform: [{ scale }],
    };
  });
  
  // Button press handlers
  const handleMapPress = () => {
    mapButtonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onMapPress();
  };
  

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={styles.placeholder} />

      <View style={styles.degreeContainer}>
        <Animated.View style={[styles.degreeBox, degreeBoxAnimatedStyle]}>
          <Text style={styles.degreeTitle}>{t('direction.title')}</Text>
          <View style={styles.degreeMainInfo}>
            <Text style={styles.degreeDirection}>{getCardinalDirection(degree)}</Text>
            <View style={styles.degreeDivider} />
            <AnimatedText style={[styles.degreeValue, degreeValueAnimatedStyle]}>
              {degree}°
            </AnimatedText>
          </View>
          <Text style={styles.degreeSecondary}>{getCardinalDirection(degree)}</Text>
        </Animated.View>
      </View>

      <AnimatedTouchableOpacity
        style={[styles.actionButton, mapButtonAnimatedStyle]}
        onPress={handleMapPress}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.buttonCircle} pointerEvents="none">
          <LocationIcon size={getResponsiveSize(22)} color="#3B2F2F" />
        </View>
        <Text style={styles.buttonLabel} pointerEvents="none">{t('button.googleMap')}</Text>
      </AnimatedTouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSize(15),
    paddingVertical: getResponsiveSize(8), // Increased from 6 to 8
    zIndex: 10,
    elevation: 10,
  },
  placeholder: {
    width: getResponsiveSize(50),
  },
  actionButton: {
    alignItems: 'center',
    gap: getResponsiveSize(4),
    zIndex: 11,
    elevation: 11,
  },
  buttonCircle: {
    width: getResponsiveSize(50),
    height: getResponsiveSize(50),
    borderRadius: getResponsiveSize(25),
    backgroundColor: '#FFFFFF', // Warm White
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.level2,
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
  },
  buttonLabel: {
    fontSize: getResponsiveFont(12),
    color: '#6B7280', // Slate
    fontWeight: '500',
    marginTop: getResponsiveSize(4),
    ...typography.labelMedium,
    letterSpacing: 0.3,
  },
  degreeContainer: {
    alignItems: 'center',
  },
  degreeBox: {
    backgroundColor: '#FFFFFF', // Warm White
    borderRadius: getResponsiveSize(8),
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
    paddingVertical: getResponsiveSize(6),
    paddingHorizontal: getResponsiveSize(16),
    minWidth: getResponsiveSize(150),
    alignItems: 'center',
    ...elevation.level2,
    shadowColor: '#F4B000', // Saffron Gold
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.22, // 20-25% opacity
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 20px rgba(244, 176, 0, 0.22)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }),
  },
  degreeTitle: {
    fontSize: getResponsiveFont(10),
    color: '#6B7280', // Slate
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: getResponsiveSize(5),
    ...typography.labelSmall,
  },
  degreeMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(2), // Increased from 1.5 to 2
  },
  degreeDirection: {
    fontSize: getResponsiveFont(20),
    fontWeight: '500',
    color: '#1F2328', // Charcoal
    letterSpacing: 0.7,
    ...typography.headlineSmall,
  },
  degreeDivider: {
    width: 1.5,
    height: getResponsiveSize(22),
    backgroundColor: '#E9E2D6', // Sand Line
    marginHorizontal: getResponsiveSize(10),
    borderRadius: 1,
  },
  degreeValue: {
    fontSize: getResponsiveFont(20),
    fontWeight: '500',
    color: '#1F2328', // Charcoal
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    letterSpacing: 0.5,
    ...typography.headlineSmall,
  },
  degreeSecondary: {
    fontSize: getResponsiveFont(10),
    color: '#6B7280', // Slate
    fontWeight: '400',
    letterSpacing: 0.5,
    ...typography.labelSmall,
  },
});

