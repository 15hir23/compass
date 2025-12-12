import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import CompassIcon from './icons/CompassIcon';
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

export default function SplashScreen({ onComplete }) {
  const { t } = useI18n();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  useEffect(() => {
    // Initial fade in
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    
    // Logo fade in
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    
    // Scale animation
    scale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    
    // Continuous rotation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Text animation
    textOpacity.value = withDelay(600, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    textTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 100 }));

    // Complete after 2.5 seconds
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) }, (finished) => {
        if (finished && onComplete) {
          onComplete();
        }
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const compassStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(
      rotation.value % 360,
      [0, 90, 180, 270, 360],
      [0.6, 0.8, 0.6, 0.8, 0.6]
    );
    return {
      opacity: glowOpacity,
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={['#FFFFFF', '#FFFEF5', '#FFF8E1']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Glow effect behind compass */}
          <Animated.View style={[styles.glow, glowStyle]} />
          
          {/* Rotating Compass */}
          <Animated.View style={[styles.compassContainer, compassStyle]}>
            <View style={styles.compassCircle}>
              <CompassIcon size={getResponsiveSize(120)} color="#F4C430" />
            </View>
          </Animated.View>

          {/* App Title */}
          <Animated.View style={[styles.textContainer, textStyle]}>
            <Text style={styles.appTitle}>{t('app.title')}</Text>
            <View style={styles.ornamentalLine} />
            <Text style={styles.appSubtitle}>{t('app.subtitle') || 'Vastu Compass'}</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: getResponsiveSize(200),
    height: getResponsiveSize(200),
    borderRadius: getResponsiveSize(100),
    backgroundColor: '#F4C430',
    opacity: 0.3,
    ...(Platform.OS === 'web' && {
      filter: 'blur(40px)',
      WebkitFilter: 'blur(40px)',
    }),
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(30),
  },
  compassCircle: {
    width: getResponsiveSize(160),
    height: getResponsiveSize(160),
    borderRadius: getResponsiveSize(80),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    borderWidth: 4,
    borderColor: '#F4C430',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 32px rgba(244, 196, 48, 0.4), 0 0 0 4px rgba(244, 196, 48, 0.2)',
    }),
  },
  textContainer: {
    alignItems: 'center',
    marginTop: getResponsiveSize(20),
  },
  appTitle: {
    fontSize: getResponsiveFont(32),
    fontWeight: '900',
    color: '#B8860B',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    textShadow: '0px 2px 8px rgba(184, 134, 11, 0.3)',
    marginBottom: getResponsiveSize(12),
  },
  ornamentalLine: {
    width: getResponsiveSize(80),
    height: 3,
    backgroundColor: '#F4C430',
    borderRadius: 2,
    marginBottom: getResponsiveSize(8),
  },
  appSubtitle: {
    fontSize: getResponsiveFont(14),
    fontWeight: '600',
    color: '#8B7355',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
});

