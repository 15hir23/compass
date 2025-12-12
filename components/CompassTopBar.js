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
  interpolate,
  Easing,
} from 'react-native-reanimated';
import SearchIcon from './icons/SearchIcon';
import CompassIcon from './icons/CompassIcon';
import LanguageToggle from './LanguageToggle';
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
const AnimatedView = Animated.createAnimatedComponent(View);

export default function CompassTopBar({ onMenuPress, onSearchPress, onBackPress }) {
  const { t } = useI18n();
  
  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(-20);
  const backButtonScale = useSharedValue(1);
  const searchBarScale = useSharedValue(1);
  const menuButtonScale = useSharedValue(1);
  const hamburgerRotation = useSharedValue(0);
  
  // Entrance animations
  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    containerTranslateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    
    // Staggered button animations
    backButtonScale.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 200 }));
    searchBarScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 200 }));
    menuButtonScale.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 200 }));
  }, []);
  
  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));
  
  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backButtonScale.value }],
  }));
  
  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
  }));
  
  const menuButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: menuButtonScale.value }],
  }));
  
  const hamburgerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${hamburgerRotation.value}deg` }],
  }));
  
  // Button press handlers with animations
  const handleBackPress = () => {
    backButtonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onBackPress();
  };
  
  const handleSearchPress = () => {
    searchBarScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onSearchPress();
  };
  
  const handleMenuPress = () => {
    menuButtonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    hamburgerRotation.value = withSequence(
      withTiming(hamburgerRotation.value + 180, { duration: 300, easing: Easing.inOut(Easing.ease) }),
      withSpring(hamburgerRotation.value + 180, { damping: 15, stiffness: 200 })
    );
    onMenuPress();
  };

  return (
    <Animated.View style={containerAnimatedStyle}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.content}>
          <AnimatedTouchableOpacity
            style={[styles.backButton, backButtonAnimatedStyle]}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonCircle}>
              <Text style={styles.backButtonText}>{t('common.back')}</Text>
            </View>
          </AnimatedTouchableOpacity>

          <AnimatedTouchableOpacity
            style={[styles.searchBar, searchBarAnimatedStyle]}
            onPress={handleSearchPress}
            activeOpacity={0.8}
          >
            <View style={styles.searchContent}>
              <SearchIcon size={getResponsiveSize(18)} color={colors.onSurfaceVariant} />
              <Text style={styles.searchText}>{t('header.search')}</Text>
            </View>
          </AnimatedTouchableOpacity>

          <View style={styles.rightButtons}>
            <LanguageToggle />
            <AnimatedTouchableOpacity
              style={[styles.menuButton, menuButtonAnimatedStyle]}
              onPress={handleMenuPress}
              activeOpacity={0.7}
            >
              <AnimatedView style={[styles.hamburger, hamburgerAnimatedStyle]}>
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </AnimatedView>
            </AnimatedTouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? getResponsiveSize(42) : getResponsiveSize(32),
    paddingBottom: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(12),
    ...elevation.level3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8),
  },
  menuButton: {
    width: getResponsiveSize(44), // Increased from 40 to 44
    height: getResponsiveSize(44), // Increased from 40 to 44
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getResponsiveSize(8),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  hamburger: {
    width: getResponsiveSize(26), // Increased from 24 to 26
    height: getResponsiveSize(20), // Increased from 18 to 20
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 3, // Increased from 2.5 to 3
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  searchBar: {
    flex: 1,
    marginHorizontal: getResponsiveSize(10),
    borderRadius: getResponsiveSize(20),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    ...(Platform.OS === 'web' && {
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }),
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: getResponsiveSize(16),
    paddingVertical: getResponsiveSize(10),
    gap: getResponsiveSize(10),
    borderWidth: 1,
    borderColor: colors.outline,
  },
  searchText: {
    fontSize: getResponsiveFont(14),
    color: colors.onSurfaceVariant,
    flex: 1,
    ...typography.bodyMedium,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonCircle: {
    width: getResponsiveSize(40), // Increased from 36 to 40
    height: getResponsiveSize(40), // Increased from 36 to 40
    borderRadius: getResponsiveSize(20), // Increased from 18 to 20
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    fontSize: getResponsiveFont(28),
    color: colors.onPrimary,
    fontWeight: '500',
    textShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
    letterSpacing: -2,
    includeFontPadding: false,
    textAlign: 'center',
    lineHeight: getResponsiveFont(28),
    ...typography.headlineSmall,
  },
});
