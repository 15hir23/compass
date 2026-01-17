import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';

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

// WhatsApp Icon
const WhatsAppIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      fill={color}
    />
  </Svg>
);

// Close Icon
const CloseIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Blog Icon
const BlogIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5C4 18.6716 4.67157 18 5.5 18H18.5C19.3284 18 20 18.6716 20 19.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V19.5Z"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <Path
      d="M4 5.5C4 4.67157 4.67157 4 5.5 4H18.5C19.3284 4 20 4.67157 20 5.5V16.5C20 17.3284 19.3284 18 18.5 18H5.5C4.67157 18 4 17.3284 4 16.5V5.5Z"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <Path
      d="M8 8H16M8 11H14M8 14H12"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Circle cx="17" cy="7" r="1.5" fill={color} />
  </Svg>
);

// Left Arrow Icon
const LeftArrowIcon = ({ size = 16, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Right Arrow Icon
const RightArrowIcon = ({ size = 16, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Carousel Images
const carouselImages = [
  require('../assets/consultation.png'),
  require('../assets/image-2.jpeg'),
  require('../assets/image-3.png'),
  require('../assets/image-4.png'),
];

export default function ConsultationModal({ visible, onClose }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const scrollViewRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  const isUserScrollingRef = useRef(false);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
      scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
      setCurrentImageIndex(0);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible]);

  // Auto-scroll functionality
  React.useEffect(() => {
    if (visible && carouselWidth > 0 && !isUserScrollingRef.current) {
      // Clear any existing interval
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }

      // Set up auto-scroll interval (9 seconds per image)
      autoScrollIntervalRef.current = setInterval(() => {
        if (!isUserScrollingRef.current && scrollViewRef.current) {
          setCurrentImageIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % carouselImages.length;
            scrollViewRef.current?.scrollTo({
              x: nextIndex * carouselWidth,
              animated: true,
            });
            return nextIndex;
          });
        }
      }, 9000); // 9 seconds

      return () => {
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
        }
      };
    } else {
      // Clear interval when modal is not visible
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    }
  }, [visible, carouselWidth]);

  const handleScroll = (event) => {
    if (carouselWidth === 0) return;
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / carouselWidth);
    setCurrentImageIndex(index);
  };

  const handleScrollBeginDrag = () => {
    // User started scrolling manually - pause auto-scroll
    isUserScrollingRef.current = true;
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }
  };

  const handleScrollEndDrag = () => {
    // User finished scrolling - resume auto-scroll after a delay
    setTimeout(() => {
      isUserScrollingRef.current = false;
      // Restart auto-scroll
      if (visible && carouselWidth > 0) {
        autoScrollIntervalRef.current = setInterval(() => {
          if (!isUserScrollingRef.current && scrollViewRef.current) {
            setCurrentImageIndex((prevIndex) => {
              const nextIndex = (prevIndex + 1) % carouselImages.length;
              scrollViewRef.current?.scrollTo({
                x: nextIndex * carouselWidth,
                animated: true,
              });
              return nextIndex;
            });
          }
        }, 9000);
      }
    }, 2000); // Resume after 2 seconds of inactivity
  };

  const handleCarouselLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setCarouselWidth(width);
  };

  const goToPreviousImage = () => {
    if (carouselWidth === 0 || !scrollViewRef.current) return;
    const newIndex = currentImageIndex === 0 ? carouselImages.length - 1 : currentImageIndex - 1;
    scrollViewRef.current.scrollTo({
      x: newIndex * carouselWidth,
      animated: true,
    });
    setCurrentImageIndex(newIndex);
    // Reset auto-scroll timer
    handleScrollBeginDrag();
    handleScrollEndDrag();
  };

  const goToNextImage = () => {
    if (carouselWidth === 0 || !scrollViewRef.current) return;
    const newIndex = (currentImageIndex + 1) % carouselImages.length;
    scrollViewRef.current.scrollTo({
      x: newIndex * carouselWidth,
      animated: true,
    });
    setCurrentImageIndex(newIndex);
    // Reset auto-scroll timer
    handleScrollBeginDrag();
    handleScrollEndDrag();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

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
  };

  const handleWhatsApp = async () => {
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
    } catch (error) {
      console.log('Error opening WhatsApp:', error);
      // Fallback to WhatsApp Web
      try {
        await Linking.openURL(`https://wa.me/7259926494`);
      } catch (fallbackError) {
        alert('Unable to open WhatsApp. Please try again later.');
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <CloseIcon size={getResponsiveSize(20)} color="#6B7280" />
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Consultation Image Carousel */}
            <View style={styles.carouselContainer}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onScrollBeginDrag={handleScrollBeginDrag}
                onScrollEndDrag={handleScrollEndDrag}
                scrollEventThrottle={16}
                style={styles.carouselScrollView}
                onLayout={handleCarouselLayout}
                {...(Platform.OS === 'web' && {
                  // Web-specific scroll behavior
                  scrollBehavior: 'smooth',
                })}
              >
                {carouselImages.map((image, index) => (
                  <View key={index} style={[styles.carouselItem, carouselWidth > 0 && { width: carouselWidth }]}>
                    <Image
                      source={image}
                      style={styles.carouselImage}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </ScrollView>
              
              {/* Navigation Arrows */}
              {carouselWidth > 0 && (
                <>
                  <TouchableOpacity
                    style={[styles.arrowButton, styles.arrowButtonLeft]}
                    onPress={goToPreviousImage}
                    activeOpacity={0.7}
                  >
                    <View style={styles.arrowButtonBackground}>
                      <LeftArrowIcon size={getResponsiveSize(14)} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.arrowButton, styles.arrowButtonRight]}
                    onPress={goToNextImage}
                    activeOpacity={0.7}
                  >
                    <View style={styles.arrowButtonBackground}>
                      <RightArrowIcon size={getResponsiveSize(14)} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </>
              )}
              
              {/* Carousel Indicators */}
              <View style={styles.indicatorContainer}>
                {carouselImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentImageIndex && styles.indicatorActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Details Section */}
            <View style={styles.detailsContainer}>
              <Text style={styles.title}>Talk to Vastu Consultant</Text>
              <Text style={styles.subtitle}>Consult Top Indian Vastu Consultant</Text>
              <Text style={styles.name}>Acharya Mahendra Tiwari</Text>
              
              <View style={styles.descriptionContainer}>
                <Text style={styles.description}>
                  Get expert Vastu guidance for your home, office, or property. Our experienced Vastu consultant will help you:
                </Text>
                
                <View style={styles.bulletList}>
                  <View style={styles.bulletItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.bulletText}>
                      Analyze your property's energy flow and alignment
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.bulletText}>
                      Provide personalized Vastu recommendations
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.bulletText}>
                      Suggest remedies and corrections for better harmony
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.bulletText}>
                      Help optimize your space for prosperity and well-being
                    </Text>
                  </View>
                </View>

                <Text style={styles.contactText}>
                  Connect with us on WhatsApp to schedule your consultation today!
                </Text>
              </View>
            </View>

            {/* About Mahendra Tiwari Section */}
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>About Mahendra Tiwari</Text>
              <Text style={styles.aboutText}>
                Learn more about Acharya Mahendra Tiwari and his expertise in Vastu Shastra, astrology, and spiritual guidance.
              </Text>
              <TouchableOpacity
                style={styles.blogButton}
                onPress={handleOpenBlog}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#F4C430', '#FFD700']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.blogButtonGradient}
                >
                  <BlogIcon size={getResponsiveSize(18)} color="#FFFFFF" />
                  <Text style={styles.blogButtonText}>Read Blog</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* WhatsApp CTA Button */}
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#25D366', '#128C7E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.whatsappGradient}
              >
                <WhatsAppIcon size={getResponsiveSize(24)} color="#FFFFFF" />
                <Text style={styles.whatsappButtonText}>Chat on WhatsApp</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSize(20),
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(20),
    width: '100%',
    maxWidth: getResponsiveSize(500),
    maxHeight: '95%',
    minHeight: '70%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#E9E2D6',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: getResponsiveSize(16),
    right: getResponsiveSize(16),
    width: getResponsiveSize(36),
    height: getResponsiveSize(36),
    borderRadius: getResponsiveSize(18),
    backgroundColor: '#FAFAF7',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: getResponsiveSize(24),
  },
  carouselContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: getResponsiveSize(20),
    paddingBottom: getResponsiveSize(16),
  },
  carouselScrollView: {
    width: '100%',
    ...(Platform.OS === 'web' && {
      // Web-specific scroll behavior
      scrollBehavior: 'smooth',
      WebkitOverflowScrolling: 'touch',
    }),
  },
  carouselItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselImage: {
    width: '100%',
    height: getResponsiveSize(320),
    borderRadius: getResponsiveSize(12),
    marginHorizontal: getResponsiveSize(20),
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveSize(12),
    gap: getResponsiveSize(8),
  },
  indicator: {
    width: getResponsiveSize(8),
    height: getResponsiveSize(8),
    borderRadius: getResponsiveSize(4),
    backgroundColor: '#D1D5DB',
  },
  indicatorActive: {
    backgroundColor: '#F4B000',
    width: getResponsiveSize(24),
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -getResponsiveSize(20) }],
    zIndex: 5,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'opacity 0.2s ease',
    }),
  },
  arrowButtonLeft: {
    left: getResponsiveSize(8),
  },
  arrowButtonRight: {
    right: getResponsiveSize(8),
  },
  arrowButtonBackground: {
    width: getResponsiveSize(26),
    height: getResponsiveSize(26),
    borderRadius: getResponsiveSize(14),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      transition: 'background-color 0.2s ease',
    }),
  },
  detailsContainer: {
    paddingHorizontal: getResponsiveSize(24),
    paddingTop: getResponsiveSize(8),
  },
  title: {
    fontSize: getResponsiveFont(22),
    fontWeight: '600',
    color: '#1F2328',
    marginBottom: getResponsiveSize(8),
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : "'DM Sans', sans-serif"),
  },
  subtitle: {
    fontSize: getResponsiveFont(15),
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: getResponsiveSize(12),
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : "'DM Sans', sans-serif"),
  },
  name: {
    fontSize: getResponsiveFont(18),
    fontWeight: '600',
    color: '#F4B000',
    marginBottom: getResponsiveSize(20),
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : "'DM Sans', sans-serif"),
  },
  descriptionContainer: {
    marginBottom: getResponsiveSize(24),
  },
  description: {
    fontSize: getResponsiveFont(15),
    fontWeight: '400',
    color: '#1F2328',
    lineHeight: getResponsiveFont(24),
    marginBottom: getResponsiveSize(16),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : "'DM Sans', sans-serif"),
  },
  bulletList: {
    marginBottom: getResponsiveSize(20),
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSize(12),
  },
  bulletPoint: {
    width: getResponsiveSize(8),
    height: getResponsiveSize(8),
    borderRadius: getResponsiveSize(4),
    backgroundColor: '#F4B000',
    marginTop: getResponsiveSize(8),
    marginRight: getResponsiveSize(12),
  },
  bulletText: {
    flex: 1,
    fontSize: getResponsiveFont(14),
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: getResponsiveFont(22),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : "'DM Sans', sans-serif"),
  },
  contactText: {
    fontSize: getResponsiveFont(15),
    fontWeight: '500',
    color: '#1F2328',
    lineHeight: getResponsiveFont(24),
    marginTop: getResponsiveSize(8),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : "'DM Sans', sans-serif"),
  },
  whatsappButton: {
    marginHorizontal: getResponsiveSize(24),
    marginTop: getResponsiveSize(8),
    borderRadius: getResponsiveSize(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  whatsappGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(16),
    paddingHorizontal: getResponsiveSize(24),
    gap: getResponsiveSize(12),
  },
  whatsappButtonText: {
    fontSize: getResponsiveFont(16),
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : "'DM Sans', sans-serif"),
  },
  aboutSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: getResponsiveSize(8),
    padding: getResponsiveSize(10),
    marginBottom: getResponsiveSize(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  aboutTitle: {
    fontSize: getResponsiveFont(14),
    fontWeight: '700',
    color: '#1F2328',
    marginBottom: getResponsiveSize(6),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : "'DM Sans', sans-serif"),
  },
  aboutText: {
    fontSize: getResponsiveFont(11),
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: getResponsiveFont(16),
    marginBottom: getResponsiveSize(8),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : "'DM Sans', sans-serif"),
  },
  blogButton: {
    borderRadius: getResponsiveSize(6),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  blogButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(6),
    paddingHorizontal: getResponsiveSize(12),
    gap: getResponsiveSize(4),
  },
  blogButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFont(11),
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : "'DM Sans', sans-serif"),
  },
});
