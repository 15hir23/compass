import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import NormalCompassPreview from './compassModes/NormalCompassPreview';
import Vastu16CompassPreview from './compassModes/Vastu16CompassPreview';
import Vastu32Compass from './compassModes/Vastu32Compass';
import ChakraCompass from './compassModes/ChakraCompass';
import Sidebar from './Sidebar';
import CompassIcon from './icons/CompassIcon';
import LanguageToggle from './LanguageToggle';
import { useI18n } from '../utils/i18n';
import LeftBehindCompass from './leftcomponent';
import BorderComponent from './border';

// Get dimensions safely
const getDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 };
  }
};

// Responsive sizing - called dynamically
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

// Corner Decoration Components
const CornerTopLeft = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Path d="M2 2 L2 20 M2 2 L20 2" stroke="#FFD700" strokeWidth="2.5" fill="none" />
    <Path d="M5 5 Q2 8 2 12 M5 5 Q8 2 12 2" stroke="#FFC107" strokeWidth="1.5" fill="none" />
    <Path d="M15 3 L18 6 M3 15 L6 18" stroke="#FFC107" strokeWidth="1.5" fill="none" />
  </Svg>
);

const CornerTopRight = ({ size = 40 }) => (
  <View style={{ width: size, height: size, overflow: 'hidden' }}>
    <View style={{ transform: [{ rotate: '-90deg' }, { scale: size / 59 }], position: 'absolute', top: -size, right: 0 }}>
      <BorderComponent width={59} height={size * 2} />
    </View>
  </View>
);

const CornerBottomLeft = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Path d="M2 38 L2 20 M2 38 L20 38" stroke="#FFD700" strokeWidth="2.5" fill="none" />
    <Path d="M5 35 Q2 32 2 28 M5 35 Q8 38 12 38" stroke="#FFC107" strokeWidth="1.5" fill="none" />
    <Path d="M15 37 L18 34 M3 25 L6 22" stroke="#FFC107" strokeWidth="1.5" fill="none" />
  </Svg>
);

const CornerBottomRight = ({ size = 40 }) => (
  <View style={{ width: size, height: size, overflow: 'hidden' }}>
    <View style={{ transform: [{ rotate: '90deg' }, { scale: size / 59 }], position: 'absolute', bottom: -size, right: 0 }}>
      <BorderComponent width={59} height={size * 2} />
    </View>
  </View>
);

const getCompassTypes = (t) => [
  {
    id: 'normal',
    title: t('compass.normal'),
    subtitle: t('compass.normal.subtitle'),
    CompassComponent: NormalCompassPreview,
    // Gradient ending with #EACB72
    colors: ['#FFF8E1', '#FFE082', '#EACB72'],
  },
  {
    id: 'vastu16',
    title: t('compass.vastu16'),
    subtitle: t('compass.vastu16.subtitle'),
    CompassComponent: Vastu16CompassPreview,
    // Gradient ending with #EACB72
    colors: ['#FFF8E1', '#FFE082', '#EACB72'],
  },
  {
    id: 'vastu32',
    title: t('compass.vastu32'),
    subtitle: t('compass.vastu32.subtitle'),
    CompassComponent: Vastu32Compass,
    // Gradient ending with #EACB72
    colors: ['#FFF8E1', '#FFE082', '#EACB72'],
  },
  {
    id: 'chakra',
    title: t('compass.chakra'),
    subtitle: t('compass.chakra.subtitle'),
    CompassComponent: ChakraCompass,
    // Gradient ending with #EACB72
    colors: ['#FFF8E1', '#FFE082', '#EACB72'],
  },
];

function CompassCard({ compass, onPress, delay = 0 }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);
  const scale = useSharedValue(0.95);

  React.useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
    translateX.value = withDelay(
      delay,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 15, stiffness: 100 })
    );
    
    // Arrow button entrance animation
    arrowButtonScale.value = withDelay(
      delay + 200,
      withSpring(1, { damping: 15, stiffness: 200 })
    );
    
    // Continuous glow animation for arrow button
    arrowButtonGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const compassSize = getResponsiveSize(118);
  const [isPressed, setIsPressed] = React.useState(false);
  const pressScale = useSharedValue(1);
  const arrowButtonGlow = useSharedValue(0);
  const arrowButtonScale = useSharedValue(1);

  const handlePressIn = () => {
    setIsPressed(true);
    pressScale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    setIsPressed(false);
    pressScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const arrowButtonAnimatedStyle = useAnimatedStyle(() => {
    const glowScale = interpolate(arrowButtonGlow.value, [0, 1], [1, 1.02]);
    const shadowOpacity = interpolate(arrowButtonGlow.value, [0, 1], [0.3, 0.6]);
    return {
      transform: [{ scale: arrowButtonScale.value * glowScale }],
      shadowOpacity,
    };
  });

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle, pressStyle]}>
      <TouchableOpacity
        style={[
          styles.card,
          isPressed && styles.cardPressed
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.cardGradient}>
          {/* Corner Decorations */}
          <View style={styles.cornerTopLeft}>
            <CornerTopLeft size={getResponsiveSize(40)} />
          </View>
          <View style={styles.cornerTopRight}>
            <CornerTopRight size={getResponsiveSize(40)} />
          </View>
          <View style={styles.cornerBottomLeft}>
            <CornerBottomLeft size={getResponsiveSize(40)} />
          </View>
          <View style={styles.cornerBottomRight}>
            <CornerBottomRight size={getResponsiveSize(40)} />
          </View>
          
          {/* Glassmorphic Overlay */}
          <View style={styles.glassOverlay} />
          
          {/* Rectangle - full card height, 1/4 card width - Left Accent Strip */}
          <View
            style={styles.cardRectangle}
          />
          
          {/* Left Behind Compass SVG - positioned from left of card */}
          <View style={styles.leftBehindCompassContainer}>
            <LeftBehindCompass 
              width={getResponsiveSize(130)} 
              height={getResponsiveSize(139)} 
            />
          </View>
          
          <View style={styles.cardInner}>
            {/* Circle behind compass - right half only */}
            <View style={styles.compassCirclePlaceholder}>
              <View style={[styles.compassCircleClip, { width: (compassSize * 1.1) / 2, height: compassSize * 1.1 }]}>
                <View style={[styles.compassCircle, { width: compassSize * 1.1, height: compassSize * 1.1, borderRadius: (compassSize * 1.1) / 2, marginLeft: -(compassSize * 1.1) / 2 }]} />
              </View>
            </View>
            
            {/* Left side - Compass */}
            <View style={styles.compassContainer}>
              <View style={styles.compassPreview}>
                <compass.CompassComponent size={compassSize} />
              </View>
            </View>
            
            {/* Right side - Name */}
            <View style={styles.titleContainer}>
              <View style={styles.titleTextContainer}>
                <Text style={styles.cardTitle} numberOfLines={2}>{compass.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>{compass.subtitle}</Text>
              </View>
              <Animated.View style={[styles.arrowContainer, arrowButtonAnimatedStyle]}>
                <Text style={styles.arrow}>Explore →</Text>
              </Animated.View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ onSelectCompass, onServicePress, compassType, onCompassTypeChange }) {
  const { t } = useI18n();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-15);
  
  const COMPASS_TYPES = getCompassTypes(t);

  React.useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gradient}>
          {/* Header */}
          <Animated.View style={[styles.header, headerStyle]}>
            <View style={styles.headerGradient}>
              <View style={styles.headerTop}>
                <TouchableOpacity
                  style={styles.hamburger}
                  onPress={() => setSidebarVisible(true)}
                  activeOpacity={0.6}
                >
                  <View style={styles.hamburgerLine} />
                  <View style={styles.hamburgerLine} />
                  <View style={styles.hamburgerLine} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                  <CompassIcon size={getResponsiveSize(18)} color="#F4B000" />
                  <Text style={styles.headerTitle}>{t('app.title')}</Text>
                </View>
                <LanguageToggle />
              </View>
            </View>
          </Animated.View>

          {/* Select Compass Type Label */}
          <Animated.View style={[styles.selectLabelContainer, headerStyle]}>
            <Text style={styles.selectLabel}>{t('header.selectCompass')}</Text>
          </Animated.View>

          {/* Compass Type Cards - Horizontal Layout */}
          <View style={styles.compassList}>
            {COMPASS_TYPES.map((compass, index) => (
              <CompassCard
                key={compass.id}
                compass={compass}
                onPress={() => onSelectCompass(compass.id)}
                delay={150 + index * 80}
              />
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLogo}>
              <View style={styles.logoCircle}>
              <View style={styles.logoInnerCircle}>
                <CompassIcon size={getResponsiveSize(22)} color="#FFFFFF" />
              </View>
              </View>
              <View style={styles.footerTextContainer}>
                <Text style={styles.footerText}>{t('footer.vastu')}</Text>
              </View>
            </View>
            <View style={styles.footerLine} />
          </View>
        </View>
      </ScrollView>

      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onShowHowToUse={() => setShowHowToUse(true)}
        compassType={compassType}
        onCompassTypeChange={onCompassTypeChange}
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
              <Text style={styles.modalTitle}>{t('instructions.title')}</Text>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: getResponsiveSize(15),
  },
  gradient: {
    flex: 1,
    minHeight: getDimensions().height,
    backgroundColor: '#FAFAF7', // Porcelain
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? getResponsiveSize(50) : getResponsiveSize(40),
    paddingBottom: getResponsiveSize(16),
    paddingHorizontal: getResponsiveSize(12),
    elevation: 12,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  headerGradient: {
    backgroundColor: '#FAFAF7', // Porcelain
    borderRadius: getResponsiveSize(16),
    paddingVertical: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E9E2D6', // Sand Line
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    }),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hamburger: {
    width: getResponsiveSize(32),
    height: getResponsiveSize(24),
    justifyContent: 'space-between',
    paddingVertical: getResponsiveSize(5),
    paddingHorizontal: getResponsiveSize(4),
    borderRadius: getResponsiveSize(6),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  hamburgerLine: {
    width: '100%',
    height: 2.5,
    backgroundColor: '#3B2F2F', // Espresso
    borderRadius: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(6),
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: getResponsiveFont(18), // Title size
    fontWeight: '600', // SemiBold
    color: '#1F2328', // Charcoal
    letterSpacing: 0.3,
    lineHeight: getResponsiveFont(25),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  selectLabelContainer: {
    paddingHorizontal: getResponsiveSize(15),
    paddingTop: getResponsiveSize(12),
    paddingBottom: getResponsiveSize(8),
  },
  selectLabel: {
    fontSize: getResponsiveFont(16), // Body size
    fontWeight: '500', // Consistent weight
    color: '#1F2328', // Charcoal
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: getResponsiveFont(24),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  compassList: {
    paddingHorizontal: getResponsiveSize(12),
    gap: getResponsiveSize(8),
  },
  cardContainer: {
    width: '100%',
    marginBottom: getResponsiveSize(8),
  },
  card: {
    borderRadius: getResponsiveSize(18), // 16-20px range
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
    backgroundColor: '#FFFFFF', // Warm White
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Very soft shadow
    shadowRadius: 8,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
    }),
  },
  cardPressed: {
    elevation: 3,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    borderColor: '#E9E2D6',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
      transform: 'translateY(-1px)',
    }),
  },
  cardGradient: {
    backgroundColor: '#FFFFFF', // Warm White
    borderRadius: getResponsiveSize(18),
    overflow: 'hidden',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: getResponsiveSize(8),
    left: getResponsiveSize(8),
    zIndex: 2,
  },
  cornerTopRight: {
    position: 'absolute',
    top: getResponsiveSize(8),
    right: getResponsiveSize(8),
    zIndex: 2,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: getResponsiveSize(8),
    left: getResponsiveSize(8),
    zIndex: 2,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: getResponsiveSize(8),
    right: getResponsiveSize(8),
    zIndex: 2,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.65)', // White @ 60-70% opacity
    borderRadius: getResponsiveSize(18),
    zIndex: 1,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
    }),
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSize(12),
    minHeight: getResponsiveSize(100),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
    zIndex: 3,
  },
  compassContainer: {
    width: getResponsiveSize(100),
    height: getResponsiveSize(100),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveSize(16),
    zIndex: 6,
  },
  leftBehindCompassContainer: {
    position: 'absolute',
    left: getResponsiveSize(-2),
    top: getResponsiveSize(-13),
    zIndex: 2,
    opacity: 1,
  },
  cardRectangle: {
    position: 'absolute',
    width: '22%',
    height: '100%',
    top: 0,
    left: 0,
    backgroundColor: '#4d351f', // Brown to match compass background
    zIndex: 2,
  },
 
  compassPreview: {
    width: getResponsiveSize(90),
    height: getResponsiveSize(90),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4d351f', // Brown background behind compass
    borderRadius: getResponsiveSize(45),
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    zIndex: 6,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: getResponsiveSize(8),
    paddingRight: getResponsiveSize(8),
  },
  titleTextContainer: {
    flex: 1,
    marginRight: getResponsiveSize(8),
  },
  compassCirclePlaceholder: {
    position: 'absolute',
    top: getResponsiveSize(-4), // Match SVG top
    left: getResponsiveSize(66), // Position relative to SVG, moved left
    zIndex: 4,
  },
  compassCircleClip: {
    overflow: 'hidden',
  },
  compassCircle: {
    backgroundColor: 'transparent',
    borderWidth: getResponsiveSize(10),
    borderColor: '#4d351f', // Brown to match compass background
  },
  cardTitle: {
    fontSize: getResponsiveFont(16), // Title size
    fontWeight: '600', // SemiBold
    color: '#1F2328', // Charcoal
    letterSpacing: 0.2,
    lineHeight: getResponsiveFont(24), // Increased line-height
    marginBottom: getResponsiveSize(4), // Increased spacing
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  cardSubtitle: {
    fontSize: getResponsiveFont(12), // Caption size
    fontWeight: '400', // Consistent weight
    color: '#6B7280', // Slate
    letterSpacing: 0.1,
    lineHeight: getResponsiveFont(18),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  arrowContainer: {
    minWidth: getResponsiveSize(65),
    height: getResponsiveSize(28),
    borderRadius: getResponsiveSize(14),
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(8),
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s ease',
    }),
  },
  arrow: {
    fontSize: getResponsiveFont(12), // Caption size
    color: '#F4B000', // Saffron Gold
    fontWeight: '500', // Consistent weight
    letterSpacing: 0.2,
    lineHeight: getResponsiveFont(18),
  },
  footer: {
    alignItems: 'center',
    paddingTop: getResponsiveSize(20),
    paddingBottom: getResponsiveSize(15),
    marginTop: getResponsiveSize(10),
    backgroundColor: '#FAFAF7', // Porcelain
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8),
    marginBottom: getResponsiveSize(8),
  },
  logoCircle: {
    width: getResponsiveSize(42),
    height: getResponsiveSize(42),
    borderRadius: getResponsiveSize(21),
    backgroundColor: '#F4B000', // Saffron Gold
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoInnerCircle: {
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    borderRadius: getResponsiveSize(16),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  footerText: {
    fontSize: getResponsiveFont(14), // Body size
    fontWeight: '500', // Consistent weight
    color: '#6B7280', // Slate
    lineHeight: getResponsiveFont(21),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  footerTextDot: {
    fontSize: getResponsiveFont(14), // Body size
    fontWeight: '500', // Consistent weight
    color: '#4CAF50',
    lineHeight: getResponsiveFont(21),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  footerLine: {
    width: '85%',
    height: 1,
    backgroundColor: '#E9E2D6', // Sand Line
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSize(20),
  },
  modalContent: {
    backgroundColor: '#FFFFFF', // Warm White
    borderRadius: getResponsiveSize(20),
    width: '100%',
    maxWidth: getResponsiveSize(400),
    maxHeight: '80%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveSize(24),
    borderBottomWidth: 1,
    borderBottomColor: '#E9E2D6', // Sand Line
    backgroundColor: '#FFFFFF', // Warm White
  },
  modalTitle: {
    fontSize: getResponsiveFont(20), // Title size
    fontWeight: '600', // SemiBold
    color: '#1F2328', // Charcoal
    flex: 1,
    letterSpacing: 0.2,
    lineHeight: getResponsiveFont(28),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  modalCloseButton: {
    width: getResponsiveSize(36),
    height: getResponsiveSize(36),
    borderRadius: getResponsiveSize(18),
    backgroundColor: '#FAFAF7', // Porcelain
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  modalCloseText: {
    fontSize: getResponsiveFont(18), // Title size
    color: '#6B7280', // Slate
    fontWeight: '600', // SemiBold
    lineHeight: getResponsiveFont(25),
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
    backgroundColor: '#F4B000', // Saffron Gold
    color: '#FFFFFF',
    fontSize: getResponsiveFont(14), // Body size
    fontWeight: '600', // SemiBold
    textAlign: 'center',
    lineHeight: getResponsiveSize(32),
    marginRight: getResponsiveSize(14),
    elevation: 3,
    shadowColor: '#F4B000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  instructionText: {
    flex: 1,
    fontSize: getResponsiveFont(14), // Body size
    color: '#6B7280', // Slate
    lineHeight: getResponsiveFont(21), // Improved line-height
    fontWeight: '500', // Consistent weight
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
});
