import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  Modal,
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
import ConsultationModal from './ConsultationModal';

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

const GridIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3H10V10H3V3Z" stroke={color} strokeWidth="1.5" fill="none" />
    <Path d="M14 3H21V10H14V3Z" stroke={color} strokeWidth="1.5" fill="none" />
    <Path d="M3 14H10V21H3V14Z" stroke={color} strokeWidth="1.5" fill="none" />
    <Path d="M14 14H21V21H14V14Z" stroke={color} strokeWidth="1.5" fill="none" />
    <Circle cx="6.5" cy="6.5" r="1" fill={color} />
    <Circle cx="17.5" cy="6.5" r="1" fill={color} />
    <Circle cx="6.5" cy="17.5" r="1" fill={color} />
    <Circle cx="17.5" cy="17.5" r="1" fill={color} />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
  </Svg>
);

const CameraIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Circle cx="12" cy="13" r="3" stroke={color} strokeWidth="1.5" fill="none" />
  </Svg>
);

const ImageIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
    <Path d="M21 15L16 10L5 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

function MenuItem({ title, onPress, icon, isActive, description }) {
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
        <View style={styles.menuItemTextContainer}>
          <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>{title}</Text>
          {description && (
            <Text 
              style={[styles.menuItemDescription, isActive && styles.menuItemDescriptionActive]}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function Sidebar({ visible, onClose, onShowHowToUse, compassType, onCompassTypeChange, onShowVastuGrid }) {
  const sidebarWidth = getDimensions().width * 0.85;
  const translateX = useSharedValue(-sidebarWidth);
  const hasOpenedOnce = React.useRef(false);
  const [showConsultation, setShowConsultation] = useState(false);
  const [showGridOptions, setShowGridOptions] = useState(false);

  React.useEffect(() => {
    if (visible) {
      // Smooth slide animation with gentle easing
      translateX.value = withTiming(0, { 
        duration: 400, 
        easing: Easing.bezier(0.25, 0.1, 0.25, 1) // Smooth ease-in-out curve
      });
      hasOpenedOnce.current = true;
    } else {
      // Even smoother closing animation - slower and gentler
      translateX.value = withTiming(-sidebarWidth, { 
        duration: 450, 
        easing: Easing.bezier(0.4, 0.0, 0.2, 1) // Gentler ease-out curve
      });
    }
  }, [visible]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: visible ? withTiming(1, { 
      duration: 400, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }) : withTiming(0, { 
      duration: 450, 
      easing: Easing.bezier(0.4, 0.0, 0.2, 1) // Gentler ease-out for closing
    }),
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

  return (
    <>
      {visible && (
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
                    onPress={() => {
                      setShowConsultation(true);
                      onClose();
                    }}
                  />
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Blog Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Resources</Text>
                  <MenuItem
                    title="Vastu Devta Grid"
                    description="Apply Vastu grid overlay to images or map"
                    icon={<GridIcon size={getResponsiveSize(22)} color="#6B7280" />}
                    onPress={() => {
                      console.log('🔲 [Sidebar] Vastu Devta Grid menu item clicked');
                      console.log('🔲 [Sidebar] Opening grid options modal');
                      setShowGridOptions(true);
                    }}
                  />
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
      )}

      {/* Consultation Modal - Always render when showConsultation is true, regardless of sidebar visibility */}
      <ConsultationModal
        visible={showConsultation}
        onClose={() => setShowConsultation(false)}
      />

      {/* Grid Options Modal */}
      <Modal
        visible={showGridOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGridOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGridOptions(false)}
        >
          <View style={[styles.gridOptionsModal, { pointerEvents: 'box-none' }]}>
            <View style={[styles.gridOptionsModalContent, { pointerEvents: 'auto' }]}>
              <View style={styles.gridOptionsHeader}>
                <Text style={styles.gridOptionsTitle}>Vastu Devta Grid</Text>
                <TouchableOpacity
                  onPress={() => setShowGridOptions(false)}
                  style={styles.closeModalButton}
                >
                  <Text style={styles.closeModalButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
            <View style={styles.gridOptionsContent}>
              <MenuItem
                title="Capture Image"
                description="Take a photo with Vastu grid overlay"
                icon={<CameraIcon size={getResponsiveSize(22)} color="#6B7280" />}
                onPress={() => {
                  console.log('📸 [Sidebar] Capture Image clicked');
                  console.log('📸 [Sidebar] Closing grid options modal');
                  setShowGridOptions(false);
                  console.log('📸 [Sidebar] Closing sidebar');
                  onClose();
                  if (onShowVastuGrid) {
                    console.log('📸 [Sidebar] Calling onShowVastuGrid with "camera"');
                    onShowVastuGrid('camera');
                  } else {
                    console.error('📸 [Sidebar] ERROR: onShowVastuGrid is not defined!');
                  }
                }}
              />
              <MenuItem
                title="Upload Image"
                description="Upload and apply Vastu grid to your image"
                icon={<ImageIcon size={getResponsiveSize(22)} color="#6B7280" />}
                onPress={() => {
                  console.log('📤 [Sidebar] Upload Image clicked');
                  console.log('📤 [Sidebar] Closing grid options modal');
                  setShowGridOptions(false);
                  console.log('📤 [Sidebar] Closing sidebar');
                  onClose();
                  if (onShowVastuGrid) {
                    console.log('📤 [Sidebar] Calling onShowVastuGrid with "upload"');
                    onShowVastuGrid('upload');
                  } else {
                    console.error('📤 [Sidebar] ERROR: onShowVastuGrid is not defined!');
                  }
                }}
              />
              <MenuItem
                title="Map Grid"
                description="View Vastu grid on interactive map"
                icon={<MapIcon size={getResponsiveSize(22)} color="#6B7280" />}
                onPress={() => {
                  console.log('🗺️ [Sidebar] Map Grid clicked');
                  console.log('🗺️ [Sidebar] Closing grid options modal');
                  setShowGridOptions(false);
                  console.log('🗺️ [Sidebar] Closing sidebar');
                  onClose();
                  if (onShowVastuGrid) {
                    console.log('🗺️ [Sidebar] Calling onShowVastuGrid with "map"');
                    onShowVastuGrid('map');
                  } else {
                    console.error('🗺️ [Sidebar] ERROR: onShowVastuGrid is not defined!');
                  }
                }}
              />
            </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  menuItemTextContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
    minWidth: 0,
  },
  menuItemText: {
    fontSize: getResponsiveFont(15),
    fontWeight: '500',
    color: '#1F2328', // Charcoal
    letterSpacing: 0.1,
    fontFamily: "'DM Sans', sans-serif",
  },
  menuItemTextActive: {
    color: '#1F2328', // Charcoal
    fontWeight: '600',
  },
  menuItemDescription: {
    fontSize: getResponsiveFont(11),
    fontWeight: '400',
    color: '#6B7280', // Slate
    marginTop: getResponsiveSize(2),
    letterSpacing: 0.05,
    fontFamily: "'DM Sans', sans-serif",
    flexShrink: 1,
  },
  menuItemDescriptionActive: {
    color: '#6B7280', // Slate
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOptionsModal: {
    width: getDimensions().width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOptionsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(16),
    width: '100%',
    padding: getResponsiveSize(20),
    ...(Platform.OS !== 'web' && {
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    }),
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
    }),
  },
  gridOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(20),
    paddingBottom: getResponsiveSize(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E9E2D6',
  },
  gridOptionsTitle: {
    fontSize: getResponsiveFont(18),
    fontWeight: '600',
    color: '#1F2328',
    fontFamily: "'DM Sans', sans-serif",
  },
  closeModalButton: {
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    borderRadius: getResponsiveSize(16),
    backgroundColor: '#FAFAF7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E2D6',
  },
  closeModalButtonText: {
    fontSize: getResponsiveFont(16),
    color: '#6B7280',
    fontWeight: '400',
    fontFamily: "'DM Sans', sans-serif",
  },
  gridOptionsContent: {
    gap: getResponsiveSize(8),
  },
});
