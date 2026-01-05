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

const ExpertIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M6 21C6 17 8 15 12 15C16 15 18 17 18 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 11V13M12 5V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const BlogIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z" stroke={color} strokeWidth="1.5" fill="none" />
    <Path d="M4 5.5C4 4.67157 4.67157 4 5.5 4H18.5C19.3284 4 20 4.67157 20 5.5V16.5C20 17.3284 19.3284 18 18.5 18H5.5C4.67157 18 4 17.3284 4 16.5V5.5Z" stroke={color} strokeWidth="1.5" fill="none" />
    <Path d="M8 8H16M8 11H14M8 14H12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Circle cx="17" cy="7" r="1.5" fill={color} />
  </Svg>
);

function MenuItem({ title, onPress, icon, isActive }) {
  const [isPressed, setIsPressed] = useState(false);
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(0);

  const handlePressIn = () => {
    setIsPressed(true);
    scale.value = withSpring(0.99, { damping: 20, stiffness: 400 });
    backgroundColor.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    setIsPressed(false);
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    backgroundColor.value = withTiming(0, { duration: 150 });
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
      activeOpacity={0.8}
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
  const sidebarWidth = getDimensions().width * 0.85;
  const translateX = useSharedValue(-sidebarWidth);
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
      translateX.value = withTiming(-sidebarWidth, { duration: 300 });
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

  const handleOpenBlog = async () => {
    try {
      const url = 'https://www.niraliveastro.com/blog';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        alert('Unable to open blog. Please check your internet connection.');
      }
    } catch (error) {
      console.log('Error opening blog:', error);
      alert('Unable to open blog. Please try again later.');
    }
    onClose();
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
                icon={<ClassicCompassIcon size={getResponsiveSize(22)} color={compassType === 'classic' ? "#F4B000" : "#6B7280"} />}
                onPress={() => {
                  onCompassTypeChange('classic');
                }}
                isActive={compassType === 'classic'}
              />
              <MenuItem
                title="Feng Shui Compass"
                icon={<YinYangIcon size={getResponsiveSize(22)} color={compassType === 'fengshui' ? "#F4B000" : "#6B7280"} />}
                onPress={() => {
                  onCompassTypeChange('fengshui');
                }}
                isActive={compassType === 'fengshui'}
              />
              <MenuItem
                title="Vastu Compass"
                icon={<VastuIcon size={getResponsiveSize(22)} color={compassType === 'vastu' ? "#F4B000" : "#6B7280"} />}
                onPress={() => {
                  onCompassTypeChange('vastu');
                }}
                isActive={compassType === 'vastu'}
              />
              <MenuItem
                title="Map Compass"
                icon={<MapIcon size={getResponsiveSize(22)} color={compassType === 'map' ? "#F4B000" : "#6B7280"} />}
                onPress={() => {
                  onCompassTypeChange('map');
                }}
                isActive={compassType === 'map'}
              />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Experts Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experts</Text>
              <MenuItem
                title="Talk to a Vastu Consultant"
                icon={<ExpertIcon size={getResponsiveSize(22)} color="#6B7280" />}
                onPress={async () => {
                  try {
                    const phoneNumber = '7259926494';
                    let url;
                    
                    if (Platform.OS === 'web') {
                      // For web, use WhatsApp Web
                      url = `https://wa.me/${phoneNumber}`;
                    } else {
                      // For mobile, try WhatsApp app first, fallback to web
                      url = `whatsapp://send?phone=${phoneNumber}`;
                    }
                    
                    const canOpen = await Linking.canOpenURL(url);
                    if (canOpen) {
                      await Linking.openURL(url);
                    } else {
                      // Fallback to WhatsApp Web if app is not available
                      const webUrl = `https://wa.me/${phoneNumber}`;
                      const canOpenWeb = await Linking.canOpenURL(webUrl);
                      if (canOpenWeb) {
                        await Linking.openURL(webUrl);
                      } else {
                        alert('Unable to open WhatsApp. Please install WhatsApp or check your internet connection.');
                      }
                    }
                    onClose();
                  } catch (error) {
                    console.log('Error opening WhatsApp:', error);
                    // Fallback to WhatsApp Web
                    try {
                      await Linking.openURL(`https://wa.me/7259926494`);
                      onClose();
                    } catch (fallbackError) {
                      alert('Unable to open WhatsApp. Please try again later.');
                    }
                  }
                }}
              />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Blog Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resources</Text>
              <MenuItem
                title="Blog"
                icon={<BlogIcon size={getResponsiveSize(22)} color="#6B7280" />}
                onPress={handleOpenBlog}
              />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Settings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
            <MenuItem
              title="Share App"
                icon={<ShareIcon size={getResponsiveSize(22)} color="#6B7280" />}
              onPress={handleShareApp}
            />
            <MenuItem
              title="Manage Permissions"
                icon={<SettingsIcon size={getResponsiveSize(22)} color="#6B7280" />}
              onPress={handleManagePermissions}
            />
            <MenuItem
              title="How to Use Vastu Compass"
                icon={<InfoIcon size={getResponsiveSize(22)} color="#6B7280" />}
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
    width: getDimensions().width * 0.85,
    maxWidth: 400,
    height: '100%',
    backgroundColor: '#FFFFFF', // Warm White
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    borderRightWidth: 1,
    borderRightColor: '#E9E2D6', // Sand Line
    ...(Platform.OS === 'web' && {
      boxShadow: '4px 0 24px rgba(0, 0, 0, 0.08)',
    }),
  },
  sidebarContent: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Warm White
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? getResponsiveSize(12) : getResponsiveSize(8),
    paddingBottom: getResponsiveSize(20),
    paddingHorizontal: getResponsiveSize(24),
    borderBottomWidth: 1,
    borderBottomColor: '#E9E2D6', // Sand Line
    backgroundColor: '#FAFAF7', // Porcelain
  },
  headerTitle: {
    fontSize: getResponsiveFont(20),
    fontWeight: '600', // SemiBold
    color: '#1F2328', // Charcoal
    letterSpacing: 0.3,
    fontFamily: "'DM Sans', sans-serif",
  },
  closeButton: {
    width: getResponsiveSize(36),
    height: getResponsiveSize(36),
    borderRadius: getResponsiveSize(18),
    backgroundColor: '#FFFFFF', // Warm White
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
    ...(Platform.OS !== 'web' && {
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    }),
  },
  closeButtonText: {
    fontSize: getResponsiveFont(18),
    color: '#6B7280', // Slate
    fontWeight: '400',
    fontFamily: "'DM Sans', sans-serif",
  },
  content: {
    flex: 1,
    paddingTop: getResponsiveSize(12),
    backgroundColor: '#FFFFFF', // Warm White
  },
  section: {
    marginBottom: getResponsiveSize(8),
  },
  sectionTitle: {
    fontSize: getResponsiveFont(11),
    fontWeight: '600',
    color: '#6B7280', // Slate
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: getResponsiveSize(24),
    paddingTop: getResponsiveSize(16),
    paddingBottom: getResponsiveSize(10),
    fontFamily: "'DM Sans', sans-serif",
  },
  divider: {
    height: 1,
    backgroundColor: '#E9E2D6', // Sand Line
    marginVertical: getResponsiveSize(12),
    marginHorizontal: getResponsiveSize(24),
  },
  menuItem: {
    marginHorizontal: getResponsiveSize(16),
    marginBottom: getResponsiveSize(4),
    borderRadius: getResponsiveSize(12),
    overflow: 'hidden',
  },
  menuItemActive: {
    backgroundColor: '#FAFAF7', // Porcelain
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
  },
  menuItemContent: {
    paddingVertical: getResponsiveSize(14),
    paddingHorizontal: getResponsiveSize(18),
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
    backgroundColor: '#FAFAF7', // Porcelain
  },
  menuItemIcon: {
    marginRight: getResponsiveSize(14),
    position: 'relative',
    zIndex: 1,
    width: getResponsiveSize(24),
    height: getResponsiveSize(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemIconActive: {
    // Icon color is handled by the icon component itself
  },
  menuItemText: {
    fontSize: getResponsiveFont(15),
    fontWeight: '500',
    color: '#1F2328', // Charcoal
    position: 'relative',
    zIndex: 1,
    letterSpacing: 0.1,
    fontFamily: "'DM Sans', sans-serif",
  },
  menuItemTextActive: {
    color: '#1F2328', // Charcoal
    fontWeight: '600',
  },
});
