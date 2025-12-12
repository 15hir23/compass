import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import CompassView from './CompassView';
import Svg, { Line, Circle, Rect } from 'react-native-svg';
import { CompassToggleIcon } from './svgs';

const { width, height } = Dimensions.get('window');

export default function CameraCapture({ onCapture, onClose, visible, mode = 'normal', compassType = 'vastu' }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const cameraRef = useRef(null);
  const scale = useSharedValue(0);
  const hasAnimated = useRef(false);
  
  // Compass & Grid Controls - Don't auto-show compass
  const [showCompass, setShowCompass] = useState(false);
  const [showVastuGrid, setShowVastuGrid] = useState(false);
  const [heading, setHeading] = useState(0);
  
  // 3 Layer Toggles
  const [showOuterLayer, setShowOuterLayer] = useState(true);
  const [showMiddleLayer, setShowMiddleLayer] = useState(true);
  const [showCenterLayer, setShowCenterLayer] = useState(true);
  
  // Grid corners (fixed positions on screen for camera overlay)
  const [gridCorners, setGridCorners] = useState([
    { x: width * 0.15, y: height * 0.25 }, // Top-Left
    { x: width * 0.85, y: height * 0.25 }, // Top-Right
    { x: width * 0.85, y: height * 0.75 }, // Bottom-Right
    { x: width * 0.15, y: height * 0.75 }, // Bottom-Left
  ]);
  
  // Drag state for corner markers
  const dragStateRef = useRef({
    activeIndex: null,
    offset: { x: 0, y: 0 },
  });

  React.useEffect(() => {
    if (permission === null) {
      // Request permission on mount
      requestPermission().catch((error) => {
        console.error('Camera permission error:', error);
      });
    }
  }, [permission, requestPermission]);

  React.useEffect(() => {
    // Animate only once when permission is granted
    if (permission?.granted && !hasAnimated.current) {
      hasAnimated.current = true;
      scale.value = withSpring(1, { 
        damping: 20, // Higher damping = less bounce
        stiffness: 150, // Lower stiffness = smoother
        mass: 0.5 // Lower mass = faster
      });
    }
  }, [permission?.granted]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const takePicture = async () => {
    if (!permission?.granted) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }
    
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });
        if (photo?.uri) {
          // Call onCapture immediately - parent will handle closing
          onCapture(photo.uri);
        }
      } catch (error) {
        console.error('Camera error:', error);
        Alert.alert('Error', error.message || 'Failed to capture image');
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const pickImage = async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Call onCapture immediately - parent will handle closing
        onCapture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  if (!visible) {
    return null;
  }

  if (!permission) {
    return (
      <Modal visible={visible} transparent={false} animationType="fade" presentationStyle="fullScreen">
        <View style={styles.container}>
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent={false} animationType="fade" presentationStyle="fullScreen">
        <View style={styles.container}>
          <Text style={styles.text}>No access to camera</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { marginTop: 10, backgroundColor: '#666' }]} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (!visible) {
    return null;
  }

  return (
    <Modal 
      visible={visible} 
      transparent={false}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
      hardwareAccelerated={true}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <Animated.View style={[styles.cameraContainer, animatedStyle]}>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
            <View style={styles.overlay}>
              {/* Top Bar */}
              <View style={styles.topBar}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.instructionText}>
                  {showVastuGrid ? 'Vastu Grid Overlay Active' : 'Position floor plan in center'}
                </Text>
              </View>

              {/* Compass Overlay - Toggleable */}
              {showCompass && (
                <View style={styles.compassOverlay}>
                  <CompassView
                    mode={mode}
                    compassType={compassType}
                    capturedImage={null}
                    onClearImage={() => {}}
                    onHeadingChange={setHeading}
                    hideCalibration={true}
                  />
                </View>
              )}

              {/* Draggable corner markers - Outside SVG for better touch handling */}
              {showVastuGrid && gridCorners.map((corner, i) => {
                const handleResponderGrant = (event) => {
                  const { pageX, pageY } = event.nativeEvent;
                  dragStateRef.current = {
                    activeIndex: i,
                    offset: {
                      x: pageX - corner.x,
                      y: pageY - corner.y,
                    },
                  };
                };
                
                const handleResponderMove = (event) => {
                  if (dragStateRef.current.activeIndex !== i) return;
                  const { pageX, pageY } = event.nativeEvent;
                  const newCorners = [...gridCorners];
                  newCorners[i] = {
                    x: Math.max(20, Math.min(width - 20, pageX - dragStateRef.current.offset.x)),
                    y: Math.max(50, Math.min(height - 150, pageY - dragStateRef.current.offset.y)),
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

              {/* Vastu Grid Overlay */}
              {showVastuGrid && (
                <Svg style={styles.gridSvg} width={width} height={height}>
                  {/* 3x3 Main Grid */}
                  {[1/3, 2/3].map((fraction, i) => (
                    <React.Fragment key={`grid-${i}`}>
                      {/* Vertical */}
                      <Line
                        x1={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * fraction}
                        y1={gridCorners[0].y}
                        x2={gridCorners[3].x + (gridCorners[2].x - gridCorners[3].x) * fraction}
                        y2={gridCorners[3].y}
                        stroke="#F4C430"
                        strokeWidth="3"
                        opacity="0.9"
                      />
                      {/* Horizontal */}
                      <Line
                        x1={gridCorners[0].x}
                        y1={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * fraction}
                        x2={gridCorners[1].x}
                        y2={gridCorners[1].y + (gridCorners[2].y - gridCorners[1].y) * fraction}
                        stroke="#F4C430"
                        strokeWidth="3"
                        opacity="0.9"
                      />
                    </React.Fragment>
                  ))}
                  
                  {/* Outer border */}
                  <Rect
                    x={gridCorners[0].x}
                    y={gridCorners[0].y}
                    width={gridCorners[1].x - gridCorners[0].x}
                    height={gridCorners[3].y - gridCorners[0].y}
                    stroke="#FFD700"
                    strokeWidth="5"
                    fill="none"
                  />
                  
                  {/* OUTER LAYER - Perimeter cells (9x9 grid outer ring) */}
                  {showOuterLayer && (
                    <>
                      {/* Top row outer cells */}
                      {[0, 1, 2, 6, 7, 8].map((col) => (
                        <Rect
                          key={`outer-top-${col}`}
                          x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * (col / 9)}
                          y={gridCorners[0].y}
                          width={(gridCorners[1].x - gridCorners[0].x) / 9}
                          height={(gridCorners[3].y - gridCorners[0].y) / 9}
                          fill="#8B4513"
                          fillOpacity="0.2"
                          stroke="#A0522D"
                          strokeWidth="1"
                        />
                      ))}
                      {/* Bottom row outer cells */}
                      {[0, 1, 2, 6, 7, 8].map((col) => (
                        <Rect
                          key={`outer-bottom-${col}`}
                          x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * (col / 9)}
                          y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * (8 / 9)}
                          width={(gridCorners[1].x - gridCorners[0].x) / 9}
                          height={(gridCorners[3].y - gridCorners[0].y) / 9}
                          fill="#8B4513"
                          fillOpacity="0.2"
                          stroke="#A0522D"
                          strokeWidth="1"
                        />
                      ))}
                      {/* Left column outer cells */}
                      {[1, 2, 6, 7].map((row) => (
                        <Rect
                          key={`outer-left-${row}`}
                          x={gridCorners[0].x}
                          y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * (row / 9)}
                          width={(gridCorners[1].x - gridCorners[0].x) / 9}
                          height={(gridCorners[3].y - gridCorners[0].y) / 9}
                          fill="#8B4513"
                          fillOpacity="0.2"
                          stroke="#A0522D"
                          strokeWidth="1"
                        />
                      ))}
                      {/* Right column outer cells */}
                      {[1, 2, 6, 7].map((row) => (
                        <Rect
                          key={`outer-right-${row}`}
                          x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * (8 / 9)}
                          y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * (row / 9)}
                          width={(gridCorners[1].x - gridCorners[0].x) / 9}
                          height={(gridCorners[3].y - gridCorners[0].y) / 9}
                          fill="#8B4513"
                          fillOpacity="0.2"
                          stroke="#A0522D"
                          strokeWidth="1"
                        />
                      ))}
                    </>
                  )}
                  
                  {/* MIDDLE LAYER - 8 cells around center (positions: N, E, S, W, NW, NE, SW, SE) */}
                  {showMiddleLayer && (
                    <>
                      {/* North */}
                      <Rect
                        x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * (3 / 9)}
                        y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * (2 / 9)}
                        width={(gridCorners[1].x - gridCorners[0].x) / 3}
                        height={(gridCorners[3].y - gridCorners[0].y) / 9}
                        fill="#4169E1"
                        fillOpacity="0.25"
                        stroke="#1E90FF"
                        strokeWidth="2"
                      />
                      {/* East */}
                      <Rect
                        x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * (6 / 9)}
                        y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * (3 / 9)}
                        width={(gridCorners[1].x - gridCorners[0].x) / 9}
                        height={(gridCorners[3].y - gridCorners[0].y) / 3}
                        fill="#4169E1"
                        fillOpacity="0.25"
                        stroke="#1E90FF"
                        strokeWidth="2"
                      />
                      {/* South */}
                      <Rect
                        x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * (3 / 9)}
                        y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * (6 / 9)}
                        width={(gridCorners[1].x - gridCorners[0].x) / 3}
                        height={(gridCorners[3].y - gridCorners[0].y) / 9}
                        fill="#4169E1"
                        fillOpacity="0.25"
                        stroke="#1E90FF"
                        strokeWidth="2"
                      />
                      {/* West */}
                      <Rect
                        x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * (2 / 9)}
                        y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * (3 / 9)}
                        width={(gridCorners[1].x - gridCorners[0].x) / 9}
                        height={(gridCorners[3].y - gridCorners[0].y) / 3}
                        fill="#4169E1"
                        fillOpacity="0.25"
                        stroke="#1E90FF"
                        strokeWidth="2"
                      />
                      {/* Northwest */}
                      <Rect
                        x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * (2 / 9)}
                        y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * (2 / 9)}
                        width={(gridCorners[1].x - gridCorners[0].x) / 9}
                        height={(gridCorners[3].y - gridCorners[0].y) / 9}
                        fill="#4169E1"
                        fillOpacity="0.25"
                        stroke="#1E90FF"
                        strokeWidth="2"
                      />
                      {/* Northeast */}
                      <Rect
                        x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * (6 / 9)}
                        y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * (2 / 9)}
                        width={(gridCorners[1].x - gridCorners[0].x) / 9}
                        height={(gridCorners[3].y - gridCorners[0].y) / 9}
                        fill="#4169E1"
                        fillOpacity="0.25"
                        stroke="#1E90FF"
                        strokeWidth="2"
                      />
                      {/* Southwest */}
                      <Rect
                        x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * (2 / 9)}
                        y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * (6 / 9)}
                        width={(gridCorners[1].x - gridCorners[0].x) / 9}
                        height={(gridCorners[3].y - gridCorners[0].y) / 9}
                        fill="#4169E1"
                        fillOpacity="0.25"
                        stroke="#1E90FF"
                        strokeWidth="2"
                      />
                      {/* Southeast */}
                      <Rect
                        x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * (6 / 9)}
                        y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) * (6 / 9)}
                        width={(gridCorners[1].x - gridCorners[0].x) / 9}
                        height={(gridCorners[3].y - gridCorners[0].y) / 9}
                        fill="#4169E1"
                        fillOpacity="0.25"
                        stroke="#1E90FF"
                        strokeWidth="2"
                      />
                    </>
                  )}
                  
                  {/* CENTER LAYER - Brahmasthan (center cell) */}
                  {showCenterLayer && (
                    <Rect
                      x={gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) / 3}
                      y={gridCorners[0].y + (gridCorners[3].y - gridCorners[0].y) / 3}
                      width={(gridCorners[1].x - gridCorners[0].x) / 3}
                      height={(gridCorners[3].y - gridCorners[0].y) / 3}
                      fill="#FFA500"
                      fillOpacity="0.4"
                      stroke="#FF8C00"
                      strokeWidth="3"
                    />
                  )}
                  
                </Svg>
              )}

              {/* Capture Frame */}
              <View style={styles.captureArea}>
                {!showVastuGrid && <View style={styles.captureFrame} />}
              </View>

              {/* Right Side Controls */}
              <View style={styles.rightControls}>
                {/* Toggle Compass */}
                <TouchableOpacity
                  style={[styles.sideButton, showCompass && styles.sideButtonActive]}
                  onPress={() => setShowCompass(!showCompass)}
                >
                  <View style={[
                    styles.compassIconContainer,
                    showCompass && styles.compassIconContainerActive
                  ]}>
                    <CompassToggleIcon size={28} color={showCompass ? "#2C2C2C" : "#F4C430"} />
                  </View>
                </TouchableOpacity>
                
                {/* Toggle Vastu Grid */}
                <TouchableOpacity
                  style={[styles.sideButton, showVastuGrid && styles.sideButtonActive]}
                  onPress={() => setShowVastuGrid(!showVastuGrid)}
                >
                  <View style={[
                    styles.omIconContainer,
                    showVastuGrid && styles.omIconContainerActive
                  ]}>
                    <Text style={[styles.sideButtonText, !showVastuGrid && styles.omSymbolText]}>
                      {showVastuGrid ? '⬜' : 'ॐ'}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {showVastuGrid && (
                  <>
                    <View style={styles.sideDivider} />
                    
                    {/* Center Layer Toggle Only */}
                    <TouchableOpacity
                      style={[styles.layerButton, showCenterLayer && styles.layerButtonActive]}
                      onPress={() => setShowCenterLayer(!showCenterLayer)}
                    >
                      <Text style={styles.layerButtonText}>C</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Bottom Bar */}
              <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                  <Text style={styles.galleryButtonText}>☰ Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                  <Text style={styles.flipButtonText}>⇄</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
  },
  cameraContainer: {
    width: width,
    height: height,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  captureArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureFrame: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    borderWidth: 4,
    borderColor: '#F4C430',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  galleryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  galleryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4C430',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    fontSize: 24,
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#667eea',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  compassOverlay: {
    position: 'absolute',
    top: height * 0.5 - 150,
    left: width * 0.5 - 150,
    width: 300,
    height: 300,
    opacity: 0.6,
    pointerEvents: 'none',
  },
  gridSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  rightControls: {
    position: 'absolute',
    top: 100,
    right: 15,
    flexDirection: 'column',
    gap: 12,
    zIndex: 100,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  sideButtonActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.9)',
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  sideButtonText: {
    fontSize: 24,
  },
  compassIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(244, 195, 48, 0.78)',
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  compassIconContainerActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.2)',
    borderColor: '#F4C430',
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  omIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(248, 205, 77, 0.69)',
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  omIconContainerActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.2)',
    borderColor: '#F4C430',
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  omSymbolText: {
    color: '#F4C430',
    fontSize: 24,
    fontWeight: '900',
  },
  sideDivider: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginVertical: 8,
  },
  layerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#999999',
  },
  layerButtonActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.95)',
    borderColor: '#F4C430',
    borderWidth: 3,
  },
  layerButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2C2C2C',
  },
  draggableCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  cornerDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF0000',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
});

