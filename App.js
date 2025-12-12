import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Updates from 'expo-updates';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import CompassView from './components/CompassView';
import LocationSearch from './components/LocationSearch';
import CameraCapture from './components/CameraCapture';
import CapturedImageModal from './components/CapturedImageModal';
import ImageGalleryModal from './components/ImageGalleryModal';
import { saveImage } from './utils/imageStorage';
import ImageShare from './components/ImageShare';
import HomeScreen from './components/HomeScreen';
import CompassTopBar from './components/CompassTopBar';
import CompassActionButtons from './components/CompassActionButtons';
import CompassInfoBar from './components/CompassInfoBar';
import CompassBottomNav from './components/CompassBottomNav';
import Sidebar from './components/Sidebar';
import MapViewModal from './components/MapViewModal';
import { useI18n } from './utils/i18n';

// Get dimensions safely
const getDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    // Fallback dimensions if Dimensions fails
    return { width: 375, height: 812 };
  }
};

// Dimensions will be retrieved dynamically

// Responsive sizing - called dynamically
const getResponsiveSize = (size) => {
  const { width } = getDimensions();
  if (!width || width === 0) return size; // Fallback if width is invalid
  
  // For web/large screens, cap the scaling
  if (Platform.OS === 'web') {
    // Use a max width of 600px for scaling on web
    const effectiveWidth = Math.min(width, 600);
    const scale = effectiveWidth / 375;
    return Math.max(size * scale, size * 0.8);
  }
  
  // For mobile, use full width scaling
  const scale = width / 375; // Base width (iPhone X)
  return Math.max(size * scale, size * 0.8); // Minimum 80% of original
};

const getResponsiveFont = (size) => {
  const { width } = getDimensions();
  if (!width || width === 0) return size; // Fallback if width is invalid
  
  // For web/large screens, cap the scaling
  if (Platform.OS === 'web') {
    const effectiveWidth = Math.min(width, 600);
    const scale = effectiveWidth / 375;
    return Math.max(size * scale, size * 0.85);
  }
  
  const scale = width / 375;
  return Math.max(size * scale, size * 0.85);
};

// Get compact button padding for smaller screens
const getButtonPadding = (basePadding) => {
  const { width } = getDimensions();
  if (!width || width === 0) return basePadding;
  
  // On smaller screens, reduce padding more aggressively
  if (width < 360) {
    return basePadding * 0.7; // 30% reduction on very small screens
  } else if (width < 375) {
    return basePadding * 0.85; // 15% reduction on small screens
  }
  return basePadding;
};

// Get compact button font size for smaller screens
const getButtonFontSize = (baseSize) => {
  const { width } = getDimensions();
  if (!width || width === 0) return baseSize;
  
  // On smaller screens, reduce font size more aggressively
  if (width < 360) {
    return baseSize * 0.85; // 15% reduction on very small screens
  } else if (width < 375) {
    return baseSize * 0.9; // 10% reduction on small screens
  }
  return baseSize;
};

const COMPASS_MODES = {
  NORMAL: 'normal',
  VASTU_16: 'vastu16',
  VASTU_32: 'vastu32',
  VASTU_45: 'vastu45',
  CHAKRA: 'chakra',
};

const COMPASS_TYPES = {
  CLASSIC: 'classic',
  FENGSHUI: 'fengshui',
  VASTU: 'vastu',
  MAP: 'map',
};

export default function App() {
  const { t } = useI18n();
  const [showHomeScreen, setShowHomeScreen] = useState(true);
  const [compassType, setCompassType] = useState(COMPASS_TYPES.VASTU); // Default to Vastu
  const [currentMode, setCurrentMode] = useState(COMPASS_MODES.NORMAL);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCapturedImageModal, setShowCapturedImageModal] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [heading, setHeading] = useState(0);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const menuVisible = useSharedValue(0);
  const compassInitialRotation = useSharedValue(0);

  // Auto-update check and cache clearance
  useEffect(() => {
    async function checkForUpdates() {
      try {
        // For web: Clear cache on page reload (except AsyncStorage for images)
        if (Platform.OS === 'web') {
          // Clear all caches except localStorage (where images are stored)
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          }
          
          // Add cache-busting timestamp to prevent browser caching
          const timestamp = new Date().getTime();
          sessionStorage.setItem('lastCacheCleared', timestamp.toString());
        }

        // Check for Expo updates
        if (!__DEV__) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            // Reload to apply the update
            await Updates.reloadAsync();
          }
        }
      } catch (error) {
        console.log('Update check failed:', error);
      }
    }

    checkForUpdates();
  }, []);

  useEffect(() => {
    // Only run loading animation when not on home screen
    if (!showHomeScreen) {
      // Initial compass rotation animation
      compassInitialRotation.value = withTiming(360, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished) {
          // After rotation completes, pause briefly then show other components
          setTimeout(() => {
            runOnJS(setIsLoading)(false);
            menuVisible.value = withSpring(1, { damping: 15, stiffness: 100 });
          }, 300); // 300ms pause
        }
      });
    } else {
      setIsLoading(false);
      // Close sidebar and modals when going to home screen
      setSidebarVisible(false);
      setShowLocationSearch(false);
      setShowMapView(false);
    }
  }, [showHomeScreen]);

  const menuAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: menuVisible.value,
      transform: [
        {
          translateY: interpolate(menuVisible.value, [0, 1], [-20, 0]),
        },
      ],
    };
  });

  const otherComponentsStyle = useAnimatedStyle(() => {
    return {
      opacity: isLoading ? 0 : menuVisible.value,
      transform: [
        {
          translateY: isLoading ? 20 : interpolate(menuVisible.value, [0, 1], [20, 0]),
        },
      ],
    };
  });

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
  };

  const handleCameraToggle = () => {
    setShowCamera(!showCamera);
  };

  const handleCompassSelect = (compassId) => {
    // Map compass IDs to modes
    const modeMap = {
      'normal': COMPASS_MODES.NORMAL,
      'vastu16': COMPASS_MODES.VASTU_16,
      'vastu32': COMPASS_MODES.VASTU_32,
      'chakra': COMPASS_MODES.CHAKRA,
    };
    
    if (modeMap[compassId]) {
      // Make sure we're in Vastu compass type when selecting Vastu modes
      setCompassType(COMPASS_TYPES.VASTU);
      setCurrentMode(modeMap[compassId]);
      setShowHomeScreen(false);
      setIsLoading(true);
      menuVisible.value = 0;
    }
  };

  const handleServicePress = (serviceId) => {
    // Handle service button presses
    console.log('Service pressed:', serviceId);
    // You can add navigation or actions here
    // For now, just log it
  };

  const handleBackToHome = () => {
    setShowHomeScreen(true);
    setIsLoading(false);
  };

  const handleCompassTypeChange = (type) => {
    // Close sidebar first
    setSidebarVisible(false);
    
    // Update compass type
    setCompassType(type);
    
    // Handle different compass types
    if (type === COMPASS_TYPES.MAP) {
      // Open map view directly - now works from any screen
      // Classic compass will be used as default if no compass type is set
      setShowMapView(true);
    } else if (type === COMPASS_TYPES.CLASSIC || type === COMPASS_TYPES.FENGSHUI) {
      // For Classic and Feng Shui, set mode to normal (they don't use mode variations)
      setCurrentMode(COMPASS_MODES.NORMAL);
      
      // Go directly to compass screen for these types
      setShowHomeScreen(false);
      
      // If already in compass view, trigger a reload animation
      if (!showHomeScreen) {
        setIsLoading(true);
        menuVisible.value = 0;
        compassInitialRotation.value = 0;
        
        // Reset and restart animation
        setTimeout(() => {
          compassInitialRotation.value = withTiming(360, {
            duration: 800,
            easing: Easing.out(Easing.cubic),
          }, (finished) => {
            if (finished) {
              setTimeout(() => {
                runOnJS(setIsLoading)(false);
                menuVisible.value = withSpring(1, { damping: 15, stiffness: 100 });
              }, 300);
            }
          });
        }, 100);
      } else {
        // Coming from home screen
        setShowHomeScreen(false);
        setIsLoading(true);
        menuVisible.value = 0;
      }
    } else if (type === COMPASS_TYPES.VASTU) {
      // Show home screen to let user select Vastu zone type
      setShowHomeScreen(true);
      setIsLoading(false);
    }
  };

  // Show HomeScreen first
  if (showHomeScreen) {
    return (
      <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2C2C2C" />
        <View style={styles.webContainer}>
          <HomeScreen
            onSelectCompass={handleCompassSelect}
            onServicePress={handleServicePress}
              compassType={compassType}
              onCompassTypeChange={handleCompassTypeChange}
          />
        </View>
      </SafeAreaView>

        {/* Map View Modal - available from home screen */}
        <MapViewModal
          visible={showMapView}
          onClose={() => setShowMapView(false)}
          mode={currentMode}
          compassType={compassType}
          selectedLocation={selectedLocation}
        />

        {/* Sidebar - available from home screen */}
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onShowHowToUse={() => setShowHowToUse(true)}
          compassType={compassType}
          onCompassTypeChange={handleCompassTypeChange}
        />
      </>
    );
  }

  return (
    <>
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#F4C430" />
        <View style={[styles.webContainer, (showCapturedImageModal || showImageGallery) && styles.blurredBackground]}>
          <View style={styles.compassScreen}>
            {/* Top Navigation Bar */}
            {!isLoading && (
              <CompassTopBar
                onMenuPress={() => setSidebarVisible(true)}
                onSearchPress={() => setShowLocationSearch(!showLocationSearch)}
                onBackPress={handleBackToHome}
              />
            )}

            {/* Location Search - shown as overlay */}
            {showLocationSearch && (
              <View style={styles.locationSearchOverlay}>
                <TouchableOpacity
                  style={styles.locationSearchOverlayBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowLocationSearch(false)}
                />
                <View style={styles.locationSearchContainer}>
                  <LocationSearch
                    onLocationSelect={(location) => {
                      setSelectedLocation(location);
                      setShowLocationSearch(false);
                    }}
                  />
                </View>
          </View>
            )}

            {/* Upper Action Buttons */}
            {!isLoading && (
              <CompassActionButtons
                onMapPress={() => {
                  setShowMapView(true);
                }}
                onCameraPress={handleCameraToggle}
                heading={heading}
              />
            )}

            {/* Compass View */}
        <View style={styles.compassContainer}>
              <CompassView 
                mode={currentMode} 
                compassType={compassType}
                capturedImage={null}
                onClearImage={() => {}}
                onHeadingChange={setHeading}
                initialRotation={compassInitialRotation}
              />
        </View>

            {/* Bottom Info Bar */}
            {!isLoading && (
              <CompassInfoBar selectedLocation={selectedLocation} />
            )}

            {/* Bottom Navigation */}
            {!isLoading && (
              <CompassBottomNav
                onCapturePress={handleCameraToggle}
                onLastCapturedPress={() => {
                  setShowImageGallery(true);
                }}
                hasCapturedImage={!!capturedImage}
              />
            )}

            {/* Camera Capture Modal */}
        {showCamera && (
          <CameraCapture
                visible={showCamera}
                mode={currentMode}
                compassType={compassType}
            onCapture={async (uri) => {
                  setShowCamera(false);
                  // Save image to storage
                  await saveImage(uri, currentMode, heading);
                  setTimeout(() => {
              setCapturedImage(uri);
              setShowCapturedImageModal(true);
                  }, 200);
                }}
                onClose={() => {
              setShowCamera(false);
            }}
          />
        )}

            {/* Captured Image Modal */}
            <CapturedImageModal
              visible={showCapturedImageModal && !!capturedImage}
              imageUri={capturedImage}
              mode={currentMode}
              compassType={compassType}
              heading={heading}
              onClose={() => setShowCapturedImageModal(false)}
              onClearImage={() => {
                setCapturedImage(null);
                setShowCapturedImageModal(false);
              }}
          />

            {/* Image Gallery Modal */}
            <ImageGalleryModal
              visible={showImageGallery}
              onClose={() => setShowImageGallery(false)}
              onSelectImage={(image) => {
                setCapturedImage(image.uri);
                setCurrentMode(image.mode);
                setShowCapturedImageModal(true);
              }}
            />

            {/* Map View Modal */}
            <MapViewModal
              visible={showMapView}
              onClose={() => setShowMapView(false)}
              mode={currentMode}
              compassType={compassType}
              selectedLocation={selectedLocation}
            />
          </View>
        </View>
    </SafeAreaView>

      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onShowHowToUse={() => setShowHowToUse(true)}
        compassType={compassType}
        onCompassTypeChange={handleCompassTypeChange}
      />

      {/* How to Use Modal */}
      <Modal
        visible={showHowToUse}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHowToUse(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System' }]}>{t('instructions.title')}</Text>
              <TouchableOpacity
                onPress={() => setShowHowToUse(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>1</Text>
                <Text style={styles.instructionText}>
                  {t('instructions.step1')}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>2</Text>
                <Text style={styles.instructionText}>
                  {t('instructions.step2')}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>3</Text>
                <Text style={styles.instructionText}>
                  {t('instructions.step3')}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>4</Text>
                <Text style={styles.instructionText}>
                  {t('instructions.step4')}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>5</Text>
                <Text style={styles.instructionText}>
                  {t('instructions.step5')}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>6</Text>
                <Text style={styles.instructionText}>
                  {t('instructions.step6')}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', // Center content on web
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%', // Max width for web
    alignSelf: 'center', // Center the container
    overflow: 'hidden', // Prevent horizontal scroll
  },
  blurredBackground: {
    opacity: 0.4,
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? getResponsiveSize(10) : getResponsiveSize(20),
    width: '100%',
  },
  gradientLoading: {
    justifyContent: 'center', // Center during loading
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? getResponsiveSize(20) : getResponsiveSize(30),
    paddingBottom: getResponsiveSize(12),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244, 196, 48, 0.2)',
    marginHorizontal: getResponsiveSize(20),
    marginBottom: getResponsiveSize(4),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(4),
  },
  title: {
    fontSize: getResponsiveFont(28),
    fontWeight: '900',
    color: '#B8860B',
    letterSpacing: 1.8,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : 'sans-serif-medium'),
    textShadow: '0px 2px 4px rgba(184, 134, 11, 0.2)',
  },
  subtitle: {
    fontSize: getResponsiveFont(11),
    color: '#8B7355',
    letterSpacing: 3,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: getResponsiveSize(4),
  },
  ornamentalLine: {
    width: getResponsiveSize(60),
    height: 2,
    backgroundColor: '#F4C430',
    marginTop: getResponsiveSize(6),
    borderRadius: 1,
  },
  compassScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  compassContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(5), // Reduced from 10
    paddingVertical: getResponsiveSize(2), // Added minimal vertical padding
    minHeight: 0,
    flexShrink: 1,
  },
  locationSearchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  locationSearchOverlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  locationSearchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? getResponsiveSize(100) : getResponsiveSize(90),
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingTop: getResponsiveSize(10),
    paddingBottom: getResponsiveSize(20),
    maxHeight: '80%',
  },
  actionButtons: {
    paddingHorizontal: getResponsiveSize(20),
    paddingBottom: Platform.OS === 'ios' ? getButtonPadding(getResponsiveSize(10)) : getButtonPadding(getResponsiveSize(12)), // Reduced padding
    paddingTop: getButtonPadding(getResponsiveSize(6)), // Reduced from 8
    overflow: 'visible', // Allow button to scale without clipping
  },
  buttonRow: {
    flexDirection: 'row',
    gap: getResponsiveSize(10),
    width: '100%',
  },
  cameraButton: {
    borderRadius: getResponsiveSize(25),
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
    minHeight: getResponsiveSize(44),
  },
  halfButton: {
    flex: 1,
    minWidth: 0, // Allow flex shrinking
  },
  buttonGradient: {
    paddingVertical: getButtonPadding(getResponsiveSize(12)),
    paddingHorizontal: getButtonPadding(getResponsiveSize(16)), // Reduced from 20
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveSize(40), // Reduced from 44
    width: '100%',
    height: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(6), // Reduced from 8
    flexShrink: 1, // Allow shrinking if needed
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: getButtonFontSize(getResponsiveFont(13)),
    fontWeight: '900',
    letterSpacing: 0.6,
    textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
    flexShrink: 1,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  backButtonContainer: {
    paddingHorizontal: getResponsiveSize(20),
    paddingTop: Platform.OS === 'ios' ? getResponsiveSize(10) : getResponsiveSize(15),
    paddingBottom: getResponsiveSize(8),
  },
  backButton: {
    borderRadius: getResponsiveSize(20),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
    alignSelf: 'flex-start',
  },
  backButtonGradient: {
    paddingVertical: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(16),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveSize(36),
    width: '100%',
    height: '100%',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(4),
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFont(14),
    fontWeight: '900',
    letterSpacing: 0.6,
    textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSize(20),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(20),
    width: '100%',
    maxWidth: getResponsiveSize(400),
    maxHeight: '80%',
    elevation: 16,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveSize(24),
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(244, 196, 48, 0.2)',
    backgroundColor: '#FFF8E1',
  },
  modalTitle: {
    fontSize: getResponsiveFont(22),
    fontWeight: '900',
    color: '#B8860B',
    flex: 1,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  modalCloseButton: {
    width: getResponsiveSize(36),
    height: getResponsiveSize(36),
    borderRadius: getResponsiveSize(18),
    backgroundColor: 'rgba(184, 134, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.3)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  modalCloseText: {
    fontSize: getResponsiveFont(18),
    color: '#B8860B',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  modalBody: {
    padding: getResponsiveSize(20),
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: getResponsiveSize(16),
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    borderRadius: getResponsiveSize(16),
    backgroundColor: '#F4C430',
    color: '#FFFFFF',
    fontSize: getResponsiveFont(15),
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: getResponsiveSize(32),
    marginRight: getResponsiveSize(14),
    elevation: 3,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  instructionText: {
    flex: 1,
    fontSize: getResponsiveFont(15),
    color: '#2C2C2C',
    lineHeight: getResponsiveFont(22),
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
});


