import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import NormalIcon from './icons/NormalIcon';
import Zones16Icon from './icons/Zones16Icon';
import Zones32Icon from './icons/Zones32Icon';
import Energy45Icon from './icons/Energy45Icon';
import ChakraIcon from './icons/ChakraIcon';

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

const MODE_INFO = {
  normal: { label: 'Normal', Icon: NormalIcon, color: ['#F4C430', '#FFD700'] },
  vastu16: { label: '16 Zones', Icon: Zones16Icon, color: ['#FF9933', '#FF8C00'] },
  vastu32: { label: '32 Zones', Icon: Zones32Icon, color: ['#DAA520', '#F4C430'] },
  vastu45: { label: '45 Energy', Icon: Energy45Icon, color: ['#FFA500', '#FF8C00'] },
  chakra: { label: 'Chakra', Icon: ChakraIcon, color: ['#B8860B', '#DAA520'] },
};

function ModeButton({ mode, isActive, onPress, modeInfo }) {
  const scale = useSharedValue(isActive ? 1.05 : 0.95);
  const opacity = useSharedValue(isActive ? 1 : 0.7);

  React.useEffect(() => {
    if (isActive) {
      scale.value = withSpring(1.02, { damping: 12 }); // Reduced scale to prevent cutoff
      opacity.value = withSpring(1, { damping: 10 });
    } else {
      scale.value = withSpring(0.98, { damping: 12 }); // Reduced scale
      opacity.value = withSpring(0.7, { damping: 10 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <TouchableOpacity
      style={styles.buttonContainer}
      onPress={onPress}
      activeOpacity={0.8}
      delayPressIn={0}
    >
      <Animated.View style={animatedStyle}>
      {isActive ? (
        <LinearGradient
          colors={modeInfo.color}
          style={styles.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        >
          <View style={styles.iconContainer} pointerEvents="none">
            <modeInfo.Icon size={getResponsiveSize(20)} color="#FFFFFF" />
          </View>
          <Text style={styles.activeLabel}>{modeInfo.label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.inactiveButton} pointerEvents="none">
          <View style={styles.iconContainer} pointerEvents="none">
            <modeInfo.Icon size={getResponsiveSize(20)} color="#F4C430" />
          </View>
          <Text style={styles.inactiveLabel}>{modeInfo.label}</Text>
        </View>
      )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function ModeSelector({ currentMode, onModeChange, modes }) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        {Object.entries(modes).map(([key, value]) => {
          const modeInfo = MODE_INFO[value];
          const isActive = currentMode === value;

          return (
            <ModeButton
              key={key}
              mode={value}
              isActive={isActive}
              onPress={() => onModeChange(value)}
              modeInfo={modeInfo}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(10),
    overflow: 'hidden', // Prevent horizontal scroll on web
    maxWidth: '100%',
  },
  scrollContent: {
    paddingHorizontal: getResponsiveSize(10),
    paddingVertical: getResponsiveSize(4), // Extra padding for scale animation
    alignItems: 'center',
  },
  buttonContainer: {
    marginHorizontal: getResponsiveSize(6),
    overflow: 'visible', // Allow scale animation
  },
  button: {
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(18), // More padding for text
    borderRadius: getResponsiveSize(20),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: getResponsiveSize(90),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  inactiveButton: {
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(18),
    borderRadius: getResponsiveSize(20),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: getResponsiveSize(90),
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  iconContainer: {
    marginBottom: getResponsiveSize(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabel: {
    color: '#FFFFFF',
    fontSize: getResponsiveFont(11),
    fontWeight: '700',
    letterSpacing: 0.8,
    textShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)',
  },
  inactiveLabel: {
    color: '#8B7355',
    fontSize: getResponsiveFont(11),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
