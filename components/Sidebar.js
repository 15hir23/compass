import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';

// Get dimensions safely
const getDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 };
  }
};

// Responsive sizing
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

// Icon Components
const ClassicCompassIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M12 2L14 10L12 12L10 10L12 2Z" fill="#DC143C" stroke={color} strokeWidth="1" />
    <Path d="M12 22L14 14L12 12L10 14L12 22Z" fill="#999999" stroke={color} strokeWidth="1" />
  </Svg>
);

const YinYangIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M12 2 A10 10 0 0 1 12 22 A5 5 0 0 1 12 12 A5 5 0 0 0 12 2" fill={color} />
    <Circle cx="12" cy="7" r="1.5" fill="#FFFFFF" />
    <Circle cx="12" cy="17" r="1.5" fill={color} />
  </Svg>
);

const VastuIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C10.5 3.5 10 5 10 7C10 9 11 10 12 10C13 10 14 9 14 7C14 5 13.5 3.5 12 2Z" fill={color} />
    <Circle cx="12" cy="12" r="2" fill={color} />
    <Path d="M6 8C4 10 4 12 6 14M18 8C20 10 20 12 18 14M8 18C10 20 14 20 16 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const MapIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6L9 3L15 6L21 3V18L15 21L9 18L3 21V6Z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill="none" />
    <Path d="M9 3V18M15 6V21" stroke={color} strokeWidth="2" />
  </Svg>
);

const ShareIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2" fill="none" />
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" />
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M8.5 13.5L15.5 17.5M8.5 10.5L15.5 6.5" stroke={color} strokeWidth="2" />
  </Svg>
);

const SettingsIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const InfoIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M12 16V12M12 8H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

function MenuItem({ title, onPress, icon, isActive }) {
  const [isPressed, setIsPressed] = useState(false);
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(0);

  const handlePressIn = () => {
    setIsPressed(true);
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    backgroundColor.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    setIsPressed(false);
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    backgroundColor.value = withTiming(0, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundColor.value,
  }));

  return (
    <TouchableOpacity
      style={[styles.menuItem, isActive && styles.menuItemActive]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.menuItemContent, animatedStyle]}>
        <Animated.View style={[styles.menuItemBackground, backgroundStyle]} />
        {icon && <View style={styles.menuItemIcon}>{icon}</View>}
        <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>{title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function Sidebar({ visible, onClose, onShowHowToUse, compassType, onCompassTypeChange }) {
  const translateX = useSharedValue(-getDimensions().width * 0.75);
  const hasOpenedOnce = React.useRef(false);

  React.useEffect(() => {
    if (visible) {
      if (!hasOpenedOnce.current) {
        // First time opening - use bounce animation
      translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
        hasOpenedOnce.current = true;
      } else {
        // Subsequent opens - smooth slide
        translateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      }
    } else {
      translateX.value = withTiming(-getDimensions().width * 0.75, { duration: 300 });
    }
  }, [visible]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: visible ? withTiming(1, { duration: 250 }) : withTiming(0, { duration: 250 }),
  }));

  const handleShareApp = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync({
          message: 'Check out this amazing Vastu Compass app!',
          url: '',
        });
      } else {
        if (Platform.OS === 'web') {
          if (navigator.share) {
            await navigator.share({
              title: 'Vastu Compass',
              text: 'Check out this amazing Vastu Compass app!',
              url: window.location.href,
            });
          }
        }
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
    onClose();
  };

  const handleManagePermissions = async () => {
    try {
      if (Platform.OS === 'ios') {
        const url = 'app-settings:';
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        }
      } else if (Platform.OS === 'android') {
        if (Linking.openSettings) {
          await Linking.openSettings();
        }
      } else {
        alert('On web, permissions are requested automatically when needed. Check your browser settings for location and device orientation permissions.');
      }
    } catch (error) {
      console.log('Error opening settings:', error);
      alert('Unable to open settings. Please go to your device settings manually.');
    }
    onClose();
  };

  const handleHowToUse = () => {
    onClose();
    if (onShowHowToUse) {
      onShowHowToUse();
    }
  };

  if (!visible) return null;

  return (
    <>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View style={[styles.sidebar, sidebarStyle]}>
        <View style={styles.sidebarContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Compass Types Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compass Types</Text>
              <MenuItem
                title="Classic Compass"
                icon={<ClassicCompassIcon size={getResponsiveSize(20)} color={compassType === 'classic' ? "#B8860B" : "#2C2C2C"} />}
                onPress={() => {
                  onCompassTypeChange('classic');
                }}
                isActive={compassType === 'classic'}
              />
              <MenuItem
                title="Feng Shui Compass"
                icon={<YinYangIcon size={getResponsiveSize(20)} color={compassType === 'fengshui' ? "#B8860B" : "#2C2C2C"} />}
                onPress={() => {
                  onCompassTypeChange('fengshui');
                }}
                isActive={compassType === 'fengshui'}
              />
              <MenuItem
                title="Vastu Compass"
                icon={<VastuIcon size={getResponsiveSize(20)} color={compassType === 'vastu' ? "#B8860B" : "#2C2C2C"} />}
                onPress={() => {
                  onCompassTypeChange('vastu');
                }}
                isActive={compassType === 'vastu'}
              />
              <MenuItem
                title="Map Compass"
                icon={<MapIcon size={getResponsiveSize(20)} color={compassType === 'map' ? "#B8860B" : "#2C2C2C"} />}
                onPress={() => {
                  onCompassTypeChange('map');
                }}
                isActive={compassType === 'map'}
              />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Settings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
            <MenuItem
              title="Share App"
                icon={<ShareIcon size={getResponsiveSize(20)} color="#2C2C2C" />}
              onPress={handleShareApp}
            />
            <MenuItem
              title="Manage Permissions"
                icon={<SettingsIcon size={getResponsiveSize(20)} color="#2C2C2C" />}
              onPress={handleManagePermissions}
            />
            <MenuItem
              title="How to Use Vastu Compass"
                icon={<InfoIcon size={getResponsiveSize(20)} color="#2C2C2C" />}
              onPress={handleHowToUse}
            />
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  overlayTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: getDimensions().width * 0.75,
    maxWidth: 280,
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 999,
    elevation: 16,
    shadowColor: '#F4C430',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(244, 196, 48, 0.2)',
  },
  sidebarContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? getResponsiveSize(50) : getResponsiveSize(40),
    paddingBottom: getResponsiveSize(15),
    paddingHorizontal: getResponsiveSize(20),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: getResponsiveFont(22),
    fontWeight: '900',
    color: '#2C2C2C',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  closeButton: {
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    borderRadius: getResponsiveSize(16),
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  closeButtonText: {
    fontSize: getResponsiveFont(16),
    color: '#666666',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: getResponsiveSize(8),
  },
  section: {
    marginBottom: getResponsiveSize(4),
  },
  sectionTitle: {
    fontSize: getResponsiveFont(12),
    fontWeight: '900',
    color: '#8B7355',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: getResponsiveSize(20),
    paddingTop: getResponsiveSize(14),
    paddingBottom: getResponsiveSize(8),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: getResponsiveSize(8),
    marginHorizontal: getResponsiveSize(20),
  },
  menuItem: {
    marginHorizontal: getResponsiveSize(12),
    marginBottom: getResponsiveSize(2),
    borderRadius: getResponsiveSize(8),
    overflow: 'hidden',
  },
  menuItemActive: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  menuItemContent: {
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(16),
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF8E1',
  },
  menuItemIcon: {
    marginRight: getResponsiveSize(12),
    position: 'relative',
    zIndex: 1,
    width: getResponsiveSize(20),
    height: getResponsiveSize(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: getResponsiveFont(15),
    fontWeight: '600',
    color: '#2C2C2C',
    position: 'relative',
    zIndex: 1,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  menuItemTextActive: {
    color: '#B8860B',
    fontWeight: '900',
  },
});
