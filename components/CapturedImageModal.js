import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Svg, Path, Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { CompassToggleIcon } from './svgs';
import CompassView from './CompassView';

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

export default function CapturedImageModal({ 
  visible, 
  imageUri, 
  mode, 
  heading, 
  onClose, 
  onClearImage,
  onImageSizeChange,
  compassType = 'vastu'
}) {
  const { width: screenWidth, height: screenHeight } = getDimensions();
  const [imageScale, setImageScale] = useState(1.0);
  const scale = useSharedValue(0);
  const imageContainerRef = useRef(null);
  
  // Grid & Compass Controls - Don't auto-show compass
  const [showCompass, setShowCompass] = useState(false);
  const [showVastuGrid, setShowVastuGrid] = useState(false);
  const [showOuterLayer, setShowOuterLayer] = useState(true);
  const [showMiddleLayer, setShowMiddleLayer] = useState(true);
  const [showCenterLayer, setShowCenterLayer] = useState(true);

  const captureImageWithCompass = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, use html2canvas directly
        const html2canvas = (await import('html2canvas')).default;
        const element = imageContainerRef.current;
        
        if (!element) {
          throw new Error('Image container not found');
        }
        
        const canvas = await html2canvas(element, {
          backgroundColor: null,
          scale: 2, // Higher quality
          logging: false,
        });
        
        return canvas.toDataURL('image/jpeg', 1.0);
      } else {
        // For mobile, use captureRef
        const uri = await captureRef(imageContainerRef, {
          format: 'jpg',
          quality: 1.0,
        });
        return uri;
      }
    } catch (error) {
      console.error('Error capturing image with compass:', error);
      throw error;
    }
  };

  const handleShare = async () => {
    try {
      const capturedUri = await captureImageWithCompass();
      
      if (Platform.OS === 'web') {
        // For web, convert data URL to blob and use Web Share API
        try {
          const response = await fetch(capturedUri);
          const blob = await response.blob();
          const file = new File([blob], `compass-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Compass Capture',
              text: 'Check out my compass capture!',
            });
          } else {
            // Fallback: just download the image
            Alert.alert('Share Not Supported', 'Sharing is not supported. Downloading instead.');
            handleDownload();
          }
        } catch (shareError) {
          // Fallback to download
          Alert.alert('Share Failed', 'Downloading image instead.');
          handleDownload();
        }
      } else {
        const shareAvailable = await Sharing.isAvailableAsync();
        if (shareAvailable) {
          await Sharing.shareAsync(capturedUri);
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const handleDownload = async () => {
    try {
      const capturedUri = await captureImageWithCompass();
      
      if (Platform.OS === 'web') {
        // For web, create a download link
        const link = document.createElement('a');
        link.href = capturedUri;
        link.download = `compass-capture-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('Success', 'Image downloaded successfully!');
      } else {
        // For mobile, save to media library
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(capturedUri);
          Alert.alert('Success', 'Image saved to gallery!');
        } else {
          Alert.alert('Permission Required', 'Please grant media library permission to save images');
        }
      }
    } catch (error) {
      console.error('Error downloading:', error);
      Alert.alert('Error', 'Failed to download image');
    }
  };

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 25, stiffness: 190 });
    } else {
      scale.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: scale.value,
    };
  });

  const MIN_SCALE = 1.0;
  const MAX_SCALE = 1.16;
  
  // Rectangle dimensions
  const baseWidth = Math.min(screenWidth * 0.85, 350);
  const baseHeight = Math.min(screenHeight * 0.65, 550);
  const containerWidth = baseWidth * imageScale;
  const containerHeight = baseHeight * imageScale;

  if (!visible || !imageUri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.85)', 'rgba(0, 0, 0, 0.95)']}
          style={styles.backdrop}
        >
          <Animated.View style={[styles.content, animatedStyle]}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F4C430', '#FFD700']}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Image with compass and grid overlay */}
            <View 
              ref={imageContainerRef}
              style={[styles.imageContainer, { width: containerWidth, height: containerHeight }]}
            >
              <Image 
                source={{ uri: imageUri }} 
                style={styles.backgroundImage} 
              />
              
              {/* Vastu Grid Overlay */}
              {showVastuGrid && (
                <Svg style={styles.gridOverlay} width={containerWidth} height={containerHeight}>
                  {/* 3x3 Grid Lines */}
                  {[1/3, 2/3].map((fraction, i) => (
                    <React.Fragment key={`grid-${i}`}>
                      {/* Vertical */}
                      <Line
                        x1={containerWidth * fraction}
                        y1={0}
                        x2={containerWidth * fraction}
                        y2={containerHeight}
                        stroke="#F4C430"
                        strokeWidth="3"
                        opacity="0.9"
                      />
                      {/* Horizontal */}
                      <Line
                        x1={0}
                        y1={containerHeight * fraction}
                        x2={containerWidth}
                        y2={containerHeight * fraction}
                        stroke="#F4C430"
                        strokeWidth="3"
                        opacity="0.9"
                      />
                    </React.Fragment>
                  ))}
                  
                  {/* Outer border */}
                  <Rect
                    x={0}
                    y={0}
                    width={containerWidth}
                    height={containerHeight}
                    stroke="#FFD700"
                    strokeWidth="5"
                    fill="none"
                  />
                  
                  {/* Brahmasthan (center cell) */}
                  {showCenterLayer && (
                    <>
                      <Rect
                        x={containerWidth / 3}
                        y={containerHeight / 3}
                        width={containerWidth / 3}
                        height={containerHeight / 3}
                        fill="#FFA500"
                        fillOpacity="0.5"
                        stroke="#FF8C00"
                        strokeWidth="4"
                      />
                      {/* OM Symbol */}
                      <SvgText
                        x={containerWidth / 2}
                        y={containerHeight / 2 + 15}
                        fontSize="40"
                        fontWeight="900"
                        fill="white"
                        textAnchor="middle"
                        opacity="0.9"
                        stroke="#FF8C00"
                        strokeWidth="2"
                      >
                        ॐ
                      </SvgText>
                    </>
                  )}
                  
                  {/* Corner markers */}
                  {[
                    {x: 0, y: 0},
                    {x: containerWidth, y: 0},
                    {x: containerWidth, y: containerHeight},
                    {x: 0, y: containerHeight}
                  ].map((corner, i) => (
                    <Circle
                      key={`corner-${i}`}
                      cx={corner.x}
                      cy={corner.y}
                      r="12"
                      fill="#FF0000"
                      stroke="white"
                      strokeWidth="3"
                      opacity="0.8"
                    />
                  ))}
                </Svg>
              )}
              
              {/* Compass Overlay - Smaller size for captured image */}
              {showCompass && (
                <View style={styles.compassWrapper}>
                  <View style={{ transform: [{ scale: 0.65 }] }}>
                    <CompassView 
                      mode={mode}
                      compassType={compassType}
                      capturedImage={null}
                      onClearImage={() => {}}
                      onHeadingChange={() => {}}
                      initialRotation={0}
                    />
                  </View>
                </View>
              )}
            </View>
            
            {/* Right Side Controls */}
            <View style={styles.rightControls}>
              {/* Toggle Compass */}
              <TouchableOpacity
                style={[styles.controlButton, showCompass && styles.controlButtonActive]}
                onPress={() => setShowCompass(!showCompass)}
                activeOpacity={0.7}
              >
                <CompassToggleIcon size={getResponsiveSize(20)} color={showCompass ? "#F4C430" : "#FFFFFF"} />
              </TouchableOpacity>
              
              {/* Toggle Grid */}
              <TouchableOpacity
                style={[styles.controlButton, showVastuGrid && styles.controlButtonActive]}
                onPress={() => setShowVastuGrid(!showVastuGrid)}
                activeOpacity={0.7}
              >
                <Text style={[styles.controlButtonText, !showVastuGrid && styles.omSymbolText]}>
                  {showVastuGrid ? '⬜' : 'ॐ'}
                </Text>
              </TouchableOpacity>
              
              {showVastuGrid && (
                <>
                  <View style={styles.controlDivider} />
                  
                  {/* Center Layer Toggle Only */}
                  <TouchableOpacity
                    style={[styles.layerControl, showCenterLayer && styles.layerControlActive]}
                    onPress={() => setShowCenterLayer(!showCenterLayer)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.layerControlText}>C</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Image size controls */}
            <View style={styles.imageControls}>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => setImageScale(Math.max(MIN_SCALE, imageScale - 0.1))}
                activeOpacity={0.8}
              >
                <Text style={styles.zoomButtonText}>−</Text>
              </TouchableOpacity>
              <View style={styles.zoomIndicator}>
                <Text style={styles.zoomIndicatorText}>
                  {Math.round(imageScale * 100)}%
                </Text>
              </View>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => setImageScale(Math.min(MAX_SCALE, imageScale + 0.1))}
                activeOpacity={0.8}
              >
                <Text style={styles.zoomButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Action buttons - Share, Download, and Clear */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <View style={styles.actionButtonContent}>
                  <Svg width={getResponsiveSize(16)} height={getResponsiveSize(16)} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37061L8.08259 9.16639C7.54305 8.44481 6.72452 8 5.8 8C4.14315 8 2.8 9.34315 2.8 11C2.8 12.6569 4.14315 14 5.8 14C6.72452 14 7.54305 13.5552 8.08259 12.8336L15.0227 16.6294C15.0077 16.7508 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C17.0755 14 16.257 14.4448 15.7174 15.1664L8.77735 11.3706C8.79229 11.2492 8.8 11.1255 8.8 11C8.8 10.8745 8.79229 10.7508 8.77735 10.6294L15.7174 6.83361C16.257 7.55519 17.0755 8 18 8Z"
                      fill="#B8860B"
                    />
                  </Svg>
                  <Text style={styles.actionButtonText}>Share</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDownload}
                activeOpacity={0.8}
              >
                <View style={styles.actionButtonContent}>
                  <Svg width={getResponsiveSize(16)} height={getResponsiveSize(16)} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2C12.5523 2 13 2.44772 13 3V13.5858L16.2929 10.2929C16.6834 9.90237 17.3166 9.90237 17.7071 10.2929C18.0976 10.6834 18.0976 11.3166 17.7071 11.7071L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L6.29289 11.7071C5.90237 11.3166 5.90237 10.6834 6.29289 10.2929C6.68342 9.90237 7.31658 9.90237 7.70711 10.2929L11 13.5858V3C11 2.44772 11.4477 2 12 2ZM4 14C4.55228 14 5 14.4477 5 15V19C5 19.5523 5.44772 20 6 20H18C18.5523 20 19 19.5523 19 19V15C19 14.4477 19.4477 14 20 14C20.5523 14 21 14.4477 21 15V19C21 20.6569 19.6569 22 18 22H6C4.34315 22 3 20.6569 3 19V15C3 14.4477 3.44772 14 4 14Z"
                      fill="#B8860B"
                    />
                  </Svg>
                  <Text style={styles.actionButtonText}>Download</Text>
                </View>
              </TouchableOpacity>

              {/* Clear image button */}
              {onClearImage && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    onClearImage();
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#DC143C', '#8B0000']}
                    style={styles.clearButtonGradient}
                  >
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 100,
  },
  closeButtonGradient: {
    width: getResponsiveSize(30),
    height: getResponsiveSize(30),
    borderRadius: getResponsiveSize(15),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(18),
    fontWeight: '900',
  },
  imageContainer: {
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    borderWidth: 3,
    borderColor: '#F4C430',
    borderRadius: getResponsiveSize(16),
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  compassWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveSize(20),
    gap: getResponsiveSize(10),
  },
  zoomButton: {
    width: getResponsiveSize(36),
    height: getResponsiveSize(36),
    borderRadius: getResponsiveSize(18),
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  zoomButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(20),
    fontWeight: '900',
    lineHeight: getResponsiveSize(20),
  },
  zoomIndicator: {
    minWidth: getResponsiveSize(50),
    paddingHorizontal: getResponsiveSize(12),
    paddingVertical: getResponsiveSize(6),
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(16),
    borderWidth: 2,
    borderColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomIndicatorText: {
    color: '#B8860B',
    fontSize: getResponsiveSize(12),
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  clearButton: {
    borderRadius: getResponsiveSize(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  clearButtonGradient: {
    paddingVertical: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(12),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: getResponsiveSize(10),
    marginTop: getResponsiveSize(15),
    marginBottom: getResponsiveSize(8),
  },
  actionButton: {
    borderRadius: getResponsiveSize(16),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F4C430',
    elevation: 4,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(16),
    gap: getResponsiveSize(6),
  },
  actionButtonText: {
    color: '#B8860B',
    fontSize: getResponsiveSize(12),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  rightControls: {
    position: 'absolute',
    right: getResponsiveSize(-55),
    top: '25%',
    flexDirection: 'column',
    gap: getResponsiveSize(10),
    zIndex: 50,
  },
  controlButton: {
    width: getResponsiveSize(46),
    height: getResponsiveSize(46),
    borderRadius: getResponsiveSize(23),
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.95)',
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  controlButtonText: {
    fontSize: getResponsiveSize(22),
  },
  omSymbolText: {
    color: '#F4C430',
    fontSize: getResponsiveSize(24),
    fontWeight: '900',
  },
  controlDivider: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginVertical: getResponsiveSize(6),
  },
  layerControl: {
    width: getResponsiveSize(46),
    height: getResponsiveSize(46),
    borderRadius: getResponsiveSize(23),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#999999',
    elevation: 4,
  },
  layerControlActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.98)',
    borderColor: '#F4C430',
    borderWidth: 3,
  },
  layerControlText: {
    fontSize: getResponsiveSize(18),
    fontWeight: '900',
    color: '#2C2C2C',
  },
});

