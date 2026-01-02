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
import { Svg, Path, Line, Circle, Rect, Text as SvgText, Polygon } from 'react-native-svg';
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
  
  // Resizable corners for the capture frame - Full screen with margins
  // Top margin increased to account for back button
  // Bottom margin increased to account for action buttons
  const [gridCorners, setGridCorners] = useState(() => {
    const marginX = screenWidth * 0.05; // 5% margin from sides
    const topMargin = Math.max(screenHeight * 0.10, 70); // More space at top for back button
    const bottomMargin = Math.max(screenHeight * 0.15, 120); // More space at bottom for action buttons
    return [
      { x: marginX, y: topMargin }, // Top-Left (lower to avoid back button)
      { x: screenWidth - marginX, y: topMargin }, // Top-Right (lower to avoid back button)
      { x: screenWidth - marginX, y: screenHeight - bottomMargin }, // Bottom-Right (above action buttons)
      { x: marginX, y: screenHeight - bottomMargin }, // Bottom-Left (above action buttons)
    ];
  });
  
  // Drag state for corner markers
  const dragStateRef = useRef({
    activeIndex: null,
    startX: 0,
    startY: 0,
    cornerStartX: 0,
    cornerStartY: 0,
  });
  
  // Update corners when screen dimensions change - keep margins
  React.useEffect(() => {
    const marginX = screenWidth * 0.05; // 5% margin from sides
    const topMargin = Math.max(screenHeight * 0.10, 70); // More space at top for back button
    const bottomMargin = Math.max(screenHeight * 0.15, 120); // More space at bottom for action buttons
    setGridCorners([
      { x: marginX, y: topMargin },
      { x: screenWidth - marginX, y: topMargin },
      { x: screenWidth - marginX, y: screenHeight - bottomMargin },
      { x: marginX, y: screenHeight - bottomMargin },
    ]);
  }, [screenWidth, screenHeight]);

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
  
  // Full screen dimensions
  const containerWidth = screenWidth;
  const containerHeight = screenHeight;

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
            {/* Go Back button - Top Left */}
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F4C430', '#FFD700']}
                style={styles.goBackButtonGradient}
              >
                <Text style={styles.goBackButtonText}>← Back</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Image with compass and grid overlay - Full screen */}
            <View 
              ref={imageContainerRef}
              style={[styles.imageContainer, StyleSheet.absoluteFill]}
            >
              <Image 
                source={{ uri: imageUri }} 
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              
              {/* Resizable Capture Frame Overlay - Full screen */}
              <Svg style={styles.gridOverlay} width={screenWidth} height={screenHeight}>
                {/* Quadrilateral border */}
                {gridCorners.length === 4 && (
                  <Polygon
                    points={`${gridCorners[0].x},${gridCorners[0].y} ${gridCorners[1].x},${gridCorners[1].y} ${gridCorners[2].x},${gridCorners[2].y} ${gridCorners[3].x},${gridCorners[3].y}`}
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth="5"
                  />
                )}
                
                {/* Vastu Grid Overlay */}
                {showVastuGrid && gridCorners.length === 4 && (() => {
                  // Bilinear interpolation helper function (like web map)
                  // gridCorners: [topLeft, topRight, bottomRight, bottomLeft]
                  const getGridPoint = (rowT, colT) => {
                    // rowT: 0 = top, 1 = bottom
                    // colT: 0 = left, 1 = right
                    const tl = gridCorners[0]; // top-left
                    const tr = gridCorners[1]; // top-right
                    const br = gridCorners[2]; // bottom-right
                    const bl = gridCorners[3]; // bottom-left
                    
                    // Interpolate along bottom edge (rowT = 1)
                    const bottomX = bl.x + (br.x - bl.x) * colT;
                    const bottomY = bl.y + (br.y - bl.y) * colT;
                    
                    // Interpolate along top edge (rowT = 0)
                    const topX = tl.x + (tr.x - tl.x) * colT;
                    const topY = tl.y + (tr.y - tl.y) * colT;
                    
                    // Interpolate vertically between top and bottom
                    const x = topX + (bottomX - topX) * rowT;
                    const y = topY + (bottomY - topY) * rowT;
                    
                    return { x, y };
                  };
                  
                  return (
                    <>
                      {/* 3x3 Grid Lines */}
                      {[1/3, 2/3].map((fraction, i) => {
                        const topPoint = getGridPoint(0, fraction);
                        const bottomPoint = getGridPoint(1, fraction);
                        const leftPoint = getGridPoint(fraction, 0);
                        const rightPoint = getGridPoint(fraction, 1);
                        
                        return (
                          <React.Fragment key={`grid-${i}`}>
                            {/* Vertical lines */}
                            <Line
                              x1={topPoint.x}
                              y1={topPoint.y}
                              x2={bottomPoint.x}
                              y2={bottomPoint.y}
                              stroke="#F4C430"
                              strokeWidth="3"
                              opacity="0.9"
                            />
                            {/* Horizontal lines */}
                            <Line
                              x1={leftPoint.x}
                              y1={leftPoint.y}
                              x2={rightPoint.x}
                              y2={rightPoint.y}
                              stroke="#F4C430"
                              strokeWidth="3"
                              opacity="0.9"
                            />
                          </React.Fragment>
                        );
                      })}
                      
                      {/* Brahmasthan (center cell) */}
                      {showCenterLayer && (() => {
                        // Center cell corners: from 1/3 to 2/3 in both directions
                        const tl = getGridPoint(1/3, 1/3); // top-left of center cell
                        const tr = getGridPoint(1/3, 2/3); // top-right of center cell
                        const br = getGridPoint(2/3, 2/3); // bottom-right of center cell
                        const bl = getGridPoint(2/3, 1/3); // bottom-left of center cell
                        const center = getGridPoint(0.5, 0.5); // exact center
                        
                        return (
                          <>
                            <Polygon
                              points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`}
                              fill="#FFA500"
                              fillOpacity="0.5"
                              stroke="#FF8C00"
                              strokeWidth="4"
                            />
                            {/* OM Symbol at exact center */}
                            <SvgText
                              x={center.x}
                              y={center.y + 15}
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
                        );
                      })()}
                    </>
                  );
                })()}
              </Svg>
              
              {/* Draggable corner markers - Always visible for resizing */}
              {gridCorners.map((corner, i) => {
                const handleResponderGrant = (event) => {
                  const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;
                  const pageX = touch.pageX || touch.locationX || 0;
                  const pageY = touch.pageY || touch.locationY || 0;
                  
                  dragStateRef.current = {
                    activeIndex: i,
                    startX: pageX,
                    startY: pageY,
                    cornerStartX: corner.x,
                    cornerStartY: corner.y,
                  };
                };
                
                const handleResponderMove = (event) => {
                  if (dragStateRef.current.activeIndex !== i) return;
                  const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;
                  const pageX = touch.pageX || touch.locationX || 0;
                  const pageY = touch.pageY || touch.locationY || 0;
                  
                  const deltaX = pageX - dragStateRef.current.startX;
                  const deltaY = pageY - dragStateRef.current.startY;
                  
                  const newCorners = [...gridCorners];
                  newCorners[i] = {
                    x: Math.max(0, Math.min(screenWidth, dragStateRef.current.cornerStartX + deltaX)),
                    y: Math.max(0, Math.min(screenHeight, dragStateRef.current.cornerStartY + deltaY)),
                  };
                  setGridCorners(newCorners);
                };
                
                const handleResponderRelease = () => {
                  dragStateRef.current.activeIndex = null;
                };
                
                return (
                  <View
                    key={`corner-${i}`}
                    style={[
                      styles.draggableCorner,
                      {
                        left: corner.x - 20,
                        top: corner.y - 20,
                      },
                    ]}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={handleResponderGrant}
                    onResponderMove={handleResponderMove}
                    onResponderRelease={handleResponderRelease}
                    onResponderTerminate={handleResponderRelease}
                  >
                    <View style={styles.cornerDot} />
                  </View>
                );
              })}
              
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
            
            {/* Action buttons - Compass, Grid, Share, Download, and Clear */}
            <View style={styles.actionButtons}>
              {/* Toggle Compass */}
              <TouchableOpacity
                style={[styles.actionButton, showCompass && styles.actionButtonActive]}
                onPress={() => setShowCompass(!showCompass)}
                activeOpacity={0.8}
              >
                <View style={styles.actionButtonContent}>
                  <CompassToggleIcon size={getResponsiveSize(16)} color={showCompass ? "#F4C430" : "#B8860B"} />
            
                </View>
              </TouchableOpacity>
              
              {/* Toggle Grid */}
              <TouchableOpacity
                style={[styles.actionButton, showVastuGrid && styles.actionButtonActive]}
                onPress={() => setShowVastuGrid(!showVastuGrid)}
                activeOpacity={0.8}
              >
                <View style={styles.actionButtonContent}>
                  <Text style={[styles.actionButtonText, { fontSize: getResponsiveSize(14) }]}>
                    {showVastuGrid ? '⬜' : 'ॐ'}
                  </Text>
                  <Text style={styles.actionButtonText}>Grid</Text>
                </View>
              </TouchableOpacity>
              
              {showVastuGrid && (
                <TouchableOpacity
                  style={[styles.actionButton, showCenterLayer && styles.actionButtonActive]}
                  onPress={() => setShowCenterLayer(!showCenterLayer)}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionButtonContent}>
                    <Text style={styles.actionButtonText}>C</Text>
                  </View>
                </TouchableOpacity>
              )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  goBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    left: 20,
    zIndex: 100,
  },
  goBackButtonGradient: {
    paddingVertical: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(16),
    borderRadius: getResponsiveSize(20),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  goBackButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(14),
    fontWeight: '700',
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
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
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(10),
    paddingVertical: getResponsiveSize(10),
    zIndex: 100,
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
    paddingHorizontal: getResponsiveSize(12),
    gap: getResponsiveSize(4),
  },
  actionButtonIconOnly: {
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
    paddingVertical: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.2)',
    borderColor: '#F4C430',
    borderWidth: 2,
  },
  actionButtonText: {
    color: '#B8860B',
    fontSize: getResponsiveSize(12),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  draggableCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    elevation: 10000,
  },
  cornerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF0000',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
});

