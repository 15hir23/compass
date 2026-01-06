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
  ScrollView,
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
import Svg, { Line, Circle, Rect, Polygon, Text as SvgText, G } from 'react-native-svg';
import { CompassToggleIcon } from './svgs';
import { GRID_STRUCTURE } from '../utils/gridStructure';
import { VASTU_GRID_9X9 } from '../utils/vastuGrid';
import { translateDevta } from '../utils/i18n';
import { useI18n } from '../utils/i18n';

const { width, height } = Dimensions.get('window');

export default function CameraCapture({ onCapture, onClose, visible, mode = 'normal', compassType = 'vastu' }) {
  const { language } = useI18n();
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
  
  // Pada popup state
  const [selectedPada, setSelectedPada] = useState(null);
  
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

  // Pada descriptions (same as MapViewModal)
  const padaDescriptions = {
    'Vayu': 'Vayu pada represents the wind element. Ideal for ventilation, air circulation, and maintaining fresh energy flow. Best for windows, doors, or open spaces.',
    'Naag': 'Naag pada is associated with serpents and hidden energies. Should be kept clean and avoid heavy construction. Suitable for storage or utility areas.',
    'Mukhya': 'Mukhya pada means "chief" or "main". Represents leadership and authority. Good for main entrances or important rooms. Maintains positive energy flow.',
    'Bhallat': 'Bhallat pada is neutral in nature. Can be used for general purposes. Avoid placing heavy objects or creating obstructions here.',
    'Som': 'Som pada represents the moon and is very positive. Excellent for bedrooms, meditation areas, or places requiring peace and tranquility.',
    'Charak': 'Charak pada is neutral. Suitable for general living spaces. Keep this area clean and well-maintained for balanced energy.',
    'Aditi': 'Aditi pada is very positive, representing the mother goddess. Ideal for kitchen, dining areas, or spaces where family gathers. Promotes harmony.',
    'Uditi': 'Uditi pada is positive and represents upward energy. Good for study rooms, libraries, or areas requiring mental clarity and focus.',
    'Isha': 'Isha pada is very positive, representing the divine. Excellent for prayer rooms, meditation spaces, or spiritual areas. Maintains purity and peace.',
    'Rog': 'Rog pada means "disease" and is negative. Should be kept clean, avoid heavy construction. Best for storage or utility areas. Requires remedies if used for living spaces.',
    'Rudrajay': 'Rudrajay pada is neutral. Represents transformation and change. Suitable for transitional spaces or areas that need periodic renewal.',
    'Bhoodhar': 'Bhoodhar pada is positive and represents earth element. Excellent for foundation, storage, or areas requiring stability. Good for heavy furniture placement.',
    'Aap': 'Aap pada is very positive, representing water element. Ideal for bathrooms, water features, or areas related to purification. Promotes flow and prosperity.',
    'Parjanya': 'Parjanya pada is positive, representing rain and fertility. Good for gardens, plants, or areas requiring growth and abundance.',
    'Sosh': 'Sosh pada is negative, meaning "drying" or "withering". Should be kept clean and avoid placing important items here. Best for utility or storage.',
    'Rudra': 'Rudra pada is neutral. Represents transformation and change. Suitable for areas that need periodic renewal or modification.',
    'Aapvatsa': 'Aapvatsa pada is positive, related to water and flow. Good for areas requiring movement and circulation. Ideal for hallways or passages.',
    'Jayant': 'Jayant pada is positive, meaning "victorious". Excellent for study rooms, offices, or areas requiring success and achievement.',
    'Asur': 'Asur pada is negative, representing negative forces. Should be kept clean and minimal. Avoid placing important rooms here. Requires Vastu remedies.',
    'Mitra': 'Mitra pada is positive, meaning "friend". Excellent for living rooms, guest areas, or spaces for social interaction. Promotes friendship and harmony.',
    'Brahma': 'Brahma pada is divine, representing the creator. This is the most sacred center (Brahmasthan). Should remain open and uncluttered. Never place heavy objects, pillars, or construction here. Ideal for meditation or open space.',
    'Aryama': 'Aryama pada is positive, representing the sun and leadership. Excellent for master bedrooms, offices, or areas requiring authority and respect.',
    'Mahendra': 'Mahendra pada is very positive, representing Indra (king of gods). Ideal for main entrances, living rooms, or important spaces. Promotes prosperity and power.',
    'Varun': 'Varun pada is neutral, representing water god. Suitable for bathrooms, water-related areas, or spaces requiring purification.',
    'Aditya': 'Aditya pada is positive, representing the sun. Excellent for east-facing rooms, study areas, or spaces requiring energy and vitality.',
    'Pushpdant': 'Pushpdant pada is positive, meaning "flower-toothed". Good for decorative areas, gardens, or spaces requiring beauty and aesthetics.',
    'Satyak': 'Satyak pada is positive, meaning "truthful". Excellent for study rooms, libraries, or areas requiring honesty and clarity of thought.',
    'Sugreev': 'Sugreev pada is neutral. Represents strength and courage. Suitable for areas requiring determination and willpower.',
    'Indraraj': 'Indraraj pada is positive, representing the king of gods. Excellent for master bedrooms, offices, or areas requiring leadership and authority.',
    'Vivasvan': 'Vivasvan pada is positive, representing the sun god. Ideal for east-facing rooms, study areas, or spaces requiring brightness and energy.',
    'Svitra': 'Svitra pada is positive. Represents purity and cleanliness. Good for bathrooms, kitchens, or areas requiring hygiene.',
    'Bhusha': 'Bhusha pada is neutral. Suitable for general purposes. Keep clean and well-maintained for balanced energy flow.',
    'Dauwarik': 'Dauwarik pada is neutral. Represents gatekeepers. Suitable for entrance areas, doorways, or transitional spaces.',
    'Indra': 'Indra pada is positive, representing the king of gods. Excellent for important rooms, offices, or areas requiring power and prosperity.',
    'Savitra': 'Savitra pada is positive, representing the sun. Ideal for east-facing areas, study rooms, or spaces requiring illumination and knowledge.',
    'Antrix': 'Antrix pada is neutral, representing space or sky. Suitable for open areas, balconies, or spaces requiring openness and freedom.',
    'Pitru': 'Pitru pada is negative, representing ancestors. Should be kept clean and respectful. Avoid placing bedrooms or important rooms here. Best for storage.',
    'Mrig': 'Mrig pada is neutral, representing deer. Suitable for general purposes. Keep clean and avoid heavy construction.',
    'Bhujang': 'Bhujang pada is negative, representing serpents. Should be kept minimal and clean. Avoid important placements. Requires Vastu remedies.',
    'Gandharva': 'Gandharva pada is neutral, representing celestial musicians. Suitable for entertainment areas, music rooms, or spaces for creativity.',
    'Yama': 'Yama pada is negative, representing death. Should be kept clean and minimal. Avoid placing bedrooms or important rooms here. Best for storage or utility.',
    'Gkhawat': 'Gkhawat pada is neutral. Suitable for general purposes. Keep clean and well-maintained.',
    'Vitath': 'Vitath pada is neutral. Represents falsehood or illusion. Should be kept clean. Avoid placing important items here.',
    'Pusha': 'Pusha pada is positive, representing nourishment. Good for kitchens, dining areas, or spaces related to food and sustenance.',
    'Agni': 'Agni pada is positive, representing fire. Excellent for kitchens, fireplaces, or areas requiring heat and transformation. Promotes energy and activity.',
  };

  // Handle pada click
  const handlePadaClick = (devtaName, devtaInfo, translatedName) => {
    setSelectedPada({
      name: translatedName,
      devta: devtaName,
      zone: devtaInfo?.zone || '',
      energy: devtaInfo?.energy || 'neutral',
      description: padaDescriptions[devtaName] || `${translatedName} pada represents a specific energy in Vastu Shastra. Each pada has unique characteristics and should be used appropriately based on its energy type.`
    });
  };

  // Helper function to get cell center point (for bilinear interpolation)
  // gridCorners: [topLeft, topRight, bottomRight, bottomLeft]
  const getCellCenter = (row, col) => {
    const rowT = row / 9; // 0 = top, 1 = bottom
    const colT = col / 9; // 0 = left, 1 = right
    
    // Interpolate along top edge (rowT = 0)
    const topX = gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * colT;
    const topY = gridCorners[0].y + (gridCorners[1].y - gridCorners[0].y) * colT;
    
    // Interpolate along bottom edge (rowT = 1)
    const bottomX = gridCorners[3].x + (gridCorners[2].x - gridCorners[3].x) * colT;
    const bottomY = gridCorners[3].y + (gridCorners[2].y - gridCorners[3].y) * colT;
    
    // Interpolate vertically between top and bottom
    const x = topX + (bottomX - topX) * rowT;
    const y = topY + (bottomY - topY) * rowT;
    
    return { x, y };
  };

  // Helper function to get cell corners
  const getCellCorners = (row, col, rowSpan, colSpan) => {
    const tl = getCellCenter(row, col);
    const tr = getCellCenter(row, col + colSpan);
    const br = getCellCenter(row + rowSpan, col + colSpan);
    const bl = getCellCenter(row + rowSpan, col);
    return { tl, tr, br, bl };
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

              {/* Capture Frame - Simple rectangle during camera view */}
              <View style={styles.captureArea}>
                {!showVastuGrid && <View style={styles.captureFrame} />}
              </View>

              {/* Vastu Grid Overlay with Pada Names */}
              {showVastuGrid && (
                <>
                  <Svg style={styles.gridSvg} width={width} height={height}>
                    {/* 3x3 Main Grid Lines */}
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
                    
                    {/* Outer border - Quadrilateral */}
                    {gridCorners.length === 4 && (
                      <Polygon
                        points={`${gridCorners[0].x},${gridCorners[0].y} ${gridCorners[1].x},${gridCorners[1].y} ${gridCorners[2].x},${gridCorners[2].y} ${gridCorners[3].x},${gridCorners[3].y}`}
                        fill="none"
                        stroke="#FFD700"
                        strokeWidth="5"
                      />
                    )}
                    
                    {/* Render all cells from GRID_STRUCTURE */}
                    {GRID_STRUCTURE.map((cell) => {
                      // Determine layer
                      const isOuter = cell.row === 0 || cell.row === 8 || cell.col === 0 || cell.col === 8;
                      const isCenter = cell.name === 'Brahma';
                      const isMiddle = !isOuter && !isCenter;
                      
                      // Skip if layer is hidden
                      if (isOuter && !showOuterLayer) return null;
                      if (isMiddle && !showMiddleLayer) return null;
                      if (isCenter && !showCenterLayer) return null;
                      
                      // Get cell corners
                      const corners = getCellCorners(cell.row, cell.col, cell.rowSpan, cell.colSpan);
                      const center = getCellCenter(cell.row + cell.rowSpan / 2, cell.col + cell.colSpan / 2);
                      
                      // Get devta info (matching map view)
                      const devtaInfo = VASTU_GRID_9X9[cell.row]?.[cell.col] || { 
                        devta: cell.name, 
                        zone: '', 
                        energy: 'neutral', 
                        color: '#87CEEB' 
                      };
                      
                      const translatedName = translateDevta(cell.name, language || 'en');
                      
                      // Use devta colors from VASTU_GRID_9X9 (matching map view)
                      // Override Brahma with lighter gold shade (matching app theme)
                      let fillColor = devtaInfo.color || '#87CEEB';
                      let strokeColor = fillColor;
                      if (cell.name === 'Brahma') {
                        fillColor = '#FFE87C'; // Light Gold - lighter shade
                        strokeColor = '#FFC125'; // Golden Yellow - lighter border
                      }
                      const fillOpacity = 0.2; // Same as map view
                      
                      // Determine border thickness based on cell size (matching map view)
                      let strokeWidth = 2;
                      const borderSpanFactor = cell.rowSpan + cell.colSpan;
                      if (cell.name === 'Brahma') {
                        strokeWidth = 4;
                      } else if (borderSpanFactor > 3) {
                        strokeWidth = 3;
                      }
                      const strokeOpacity = 0.8; // Same as map view
                      
                      // Hierarchical font sizing (matching map view)
                      let fontSize = 9;
                      let fontWeight = 'bold';
                      let padding = 3;
                      let borderRadius = 4;
                      let letterSpacing = 0.5;
                      
                      const cellSpanFactor = cell.rowSpan + cell.colSpan;
                      
                      if (cell.name === 'Brahma') {
                        fontSize = 18;
                        fontWeight = '900';
                        padding = 6;
                        borderRadius = 8;
                        letterSpacing = 2;
                      } else if (cell.name === 'Bhoodhar' || cell.name === 'Vivasvan') {
                        fontSize = 14;
                        fontWeight = '800';
                        padding = 5;
                        borderRadius = 6;
                        letterSpacing = 1;
                      } else if (cell.name === 'Mitra' || cell.name === 'Aryama') {
                        fontSize = 13;
                        fontWeight = '800';
                        padding = 4;
                        borderRadius = 6;
                        letterSpacing = 0.8;
                      } else if (cellSpanFactor === 3) {
                        fontSize = 11;
                        fontWeight = '700';
                        padding = 3;
                        letterSpacing = 0.6;
                      } else if (cell.name === 'Pushpdant' || cell.name === 'Gandharva') {
                        fontSize = 8;
                        padding = 2;
                        letterSpacing = 0.3;
                      }
                      
                      // Text color and border (matching map view)
                      const textColor = cell.name === 'Brahma' ? '#8B4513' : '#654321';
                      const borderColor = cell.name === 'Brahma' ? '#DAA520' : '#B8860B';
                      const bgColor = devtaInfo.color || '#87CEEB';
                      
                      // Better text width estimation (accounting for uppercase and font weight)
                      // Uppercase text is wider, and bold text takes more space
                      const uppercaseName = translatedName.toUpperCase();
                      
                      // More accurate character width calculation based on font weight
                      // Heavier fonts need more space per character
                      const charWidthMultiplier = fontWeight === '900' ? 0.7 : fontWeight === '800' ? 0.68 : fontWeight === '700' ? 0.65 : 0.6;
                      const avgCharWidth = fontSize * charWidthMultiplier;
                      
                      // Calculate text width with better accuracy
                      let textWidth = uppercaseName.length * avgCharWidth;
                      
                      // Add extra width for longer words (responsive adjustment)
                      if (uppercaseName.length > 8) {
                        textWidth *= 1.15; // 15% more width for longer words
                      } else if (uppercaseName.length > 6) {
                        textWidth *= 1.1; // 10% more width for medium words
                      }
                      
                      const textHeight = fontSize * 1.3; // Better line height
                      
                      // Responsive padding - more padding for longer words
                      const baseHorizontalPadding = padding * 1.8; // Increased base padding
                      const baseVerticalPadding = padding * 1.3;
                      
                      // Extra padding for longer words
                      const extraPadding = uppercaseName.length > 8 ? padding * 0.5 : uppercaseName.length > 6 ? padding * 0.3 : 0;
                        const horizontalPadding = baseHorizontalPadding + extraPadding;
                        const verticalPadding = baseVerticalPadding;
                        
                        const boxWidth = Math.max(textWidth + (horizontalPadding * 2), fontSize * 2.5); // Increased minimum width
                        const boxHeight = textHeight + (verticalPadding * 2);
                        
                        // Calculate cell width to ensure labels don't clash with neighbors
                        const cellWidth = Math.abs(corners.tr.x - corners.tl.x);
                        const minGap = fontSize * 0.4; // Minimal gap (40% of font size) to prevent collisions
                        const maxBoxWidth = cellWidth - (minGap * 2); // Leave gap on both sides
                        const finalBoxWidth = Math.min(boxWidth, maxBoxWidth);
                        
                        return (
                        <React.Fragment key={`cell-${cell.row}-${cell.col}-${cell.name}`}>
                          {/* Cell polygon */}
                          <Polygon
                            points={`${corners.tl.x},${corners.tl.y} ${corners.tr.x},${corners.tr.y} ${corners.br.x},${corners.br.y} ${corners.bl.x},${corners.bl.y}`}
                            fill={fillColor}
                            fillOpacity={fillOpacity}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            onPress={() => handlePadaClick(cell.name, devtaInfo, translatedName)}
                          />
                          
                          {/* Pada name label with background box (matching map view style) - Skip Brahma */}
                          {cell.name !== 'Brahma' && (
                            <G>
                              {/* Background box with shadow effect */}
                              <Rect
                                x={center.x - finalBoxWidth / 2}
                                y={center.y - boxHeight / 2}
                                width={finalBoxWidth}
                                height={boxHeight}
                                rx={borderRadius}
                                ry={borderRadius}
                                fill={bgColor}
                                fillOpacity={0.9}
                                stroke={borderColor}
                                strokeWidth={2}
                              />
                              {/* White border highlight */}
                              <Rect
                                x={center.x - finalBoxWidth / 2 + 1}
                                y={center.y - boxHeight / 2 + 1}
                                width={finalBoxWidth - 2}
                                height={boxHeight - 2}
                                rx={borderRadius - 1}
                                ry={borderRadius - 1}
                                fill="none"
                                stroke="rgba(255,255,255,0.5)"
                                strokeWidth={1}
                              />
                              {/* Text */}
                              <SvgText
                                x={center.x}
                                y={center.y + fontSize / 3}
                                fontSize={fontSize}
                                fontWeight={fontWeight}
                                fontFamily="'DM Sans', sans-serif"
                                fill={textColor}
                                textAnchor="middle"
                                onPress={() => handlePadaClick(cell.name, devtaInfo, translatedName)}
                              >
                                {translatedName.toUpperCase()}
                              </SvgText>
                            </G>
                          )}
                        </React.Fragment>
                      );
                    })}
                    
                    {/* Watermarks - NiraLiveAstro.com */}
                    {/* Top center watermark - positioned relative to top grid line */}
                    {gridCorners.length === 4 && (() => {
                      // Calculate midpoint along the top edge line
                      const topMidX = (gridCorners[0].x + gridCorners[1].x) / 2;
                      const topMidY = (gridCorners[0].y + gridCorners[1].y) / 2;
                      // Calculate perpendicular offset (15px above the line)
                      const dx = gridCorners[1].x - gridCorners[0].x;
                      const dy = gridCorners[1].y - gridCorners[0].y;
                      const lineLength = Math.sqrt(dx * dx + dy * dy);
                      
                      let watermarkX = topMidX;
                      let watermarkY = topMidY - 15; // Default: 15px above
                      
                      // If line has length, calculate perpendicular offset
                      if (lineLength > 0) {
                        // Normal vector pointing upward (perpendicular to top line, pointing above)
                        // Use (dy, -dx) instead of (-dy, dx) to point upward (negative y direction)
                        const perpX = dy / lineLength;
                        const perpY = -dx / lineLength;
                        // Position 15px above the top line
                        watermarkX = topMidX + perpX * 15;
                        watermarkY = topMidY + perpY * 15;
                      }
                      
                      return (
                        <SvgText
                          x={watermarkX}
                          y={watermarkY}
                          fontSize={12}
                          fontFamily="'DM Sans', sans-serif"
                          fill="rgba(255, 255, 255, 0.7)"
                          textAnchor="middle"
                          fontWeight="500"
                        >
                          NiraLiveAstro.com
                        </SvgText>
                      );
                    })()}
                    
                    {/* Left side watermark (rotated 90 degrees) */}
                    <G transform={`translate(20, ${height / 2}) rotate(90)`}>
                      <SvgText
                        x={0}
                        y={0}
                        fontSize={12}
                        fontFamily="'DM Sans', sans-serif"
                        fill="rgba(255, 255, 255, 0.7)"
                        textAnchor="middle"
                        fontWeight="500"
                      >
                        NiraLiveAstro.com
                      </SvgText>
                    </G>
                    
                    {/* Right side watermark (rotated -90 degrees) */}
                    <G transform={`translate(${width - 20}, ${height / 2}) rotate(-90)`}>
                      <SvgText
                        x={0}
                        y={0}
                        fontSize={12}
                        fontFamily="'DM Sans', sans-serif"
                        fill="rgba(255, 255, 255, 0.7)"
                        textAnchor="middle"
                        fontWeight="500"
                      >
                        NiraLiveAstro.com
                      </SvgText>
                    </G>
                    
                    {/* Bottom center watermark */}
                    <SvgText
                      x={width / 2}
                      y={height - 30}
                      fontSize={12}
                      fontFamily="'DM Sans', sans-serif"
                      fill="rgba(255, 255, 255, 0.7)"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      NiraLiveAstro.com
                    </SvgText>
                  </Svg>
                  
                  {/* Clickable overlays for better touch handling */}
                  {GRID_STRUCTURE.map((cell) => {
                    const isOuter = cell.row === 0 || cell.row === 8 || cell.col === 0 || cell.col === 8;
                    const isCenter = cell.name === 'Brahma';
                    const isMiddle = !isOuter && !isCenter;
                    
                    if (isOuter && !showOuterLayer) return null;
                    if (isMiddle && !showMiddleLayer) return null;
                    if (isCenter && !showCenterLayer) return null;
                    
                    const corners = getCellCorners(cell.row, cell.col, cell.rowSpan, cell.colSpan);
                    const devtaInfo = VASTU_GRID_9X9[cell.row]?.[cell.col] || { 
                      devta: cell.name, 
                      zone: '', 
                      energy: 'neutral', 
                      color: '#87CEEB' 
                    };
                    const translatedName = translateDevta(cell.name, language || 'en');
                    
                    // Calculate bounding box for touch area
                    const minX = Math.min(corners.tl.x, corners.tr.x, corners.br.x, corners.bl.x);
                    const maxX = Math.max(corners.tl.x, corners.tr.x, corners.br.x, corners.bl.x);
                    const minY = Math.min(corners.tl.y, corners.tr.y, corners.br.y, corners.bl.y);
                    const maxY = Math.max(corners.tl.y, corners.tr.y, corners.br.y, corners.bl.y);
                    
                    return (
                      <TouchableOpacity
                        key={`touch-${cell.row}-${cell.col}-${cell.name}`}
                        style={{
                          position: 'absolute',
                          left: minX,
                          top: minY,
                          width: maxX - minX,
                          height: maxY - minY,
                        }}
                        onPress={() => handlePadaClick(cell.name, devtaInfo, translatedName)}
                        activeOpacity={0.7}
                      />
                    );
                  })}
                </>
              )}

              {/* Capture Frame - Now handled by SVG polygon above */}

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
                    
                    {/* Outer Layer Toggle */}
                    <TouchableOpacity
                      style={[styles.layerButton, showOuterLayer && styles.layerButtonActive]}
                      onPress={() => setShowOuterLayer(!showOuterLayer)}
                    >
                      <Text style={styles.layerButtonText}>O</Text>
                    </TouchableOpacity>
                    
                    {/* Middle Layer Toggle */}
                    <TouchableOpacity
                      style={[styles.layerButton, showMiddleLayer && styles.layerButtonActive]}
                      onPress={() => setShowMiddleLayer(!showMiddleLayer)}
                    >
                      <Text style={styles.layerButtonText}>M</Text>
                    </TouchableOpacity>
                    
                    {/* Center Layer Toggle */}
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
        
        {/* Pada Information Popup */}
        {selectedPada && (
          <View style={styles.padaPopupContainer}>
            <View style={styles.padaPopupContent}>
              <ScrollView 
                style={styles.padaPopupScrollView}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.padaPopupHeader}>
                  <Text style={styles.padaPopupTitle}>{selectedPada.name}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedPada(null)}
                    style={styles.padaPopupCloseButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.padaPopupCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.padaPopupBody}>
                  {selectedPada.zone && (
                    <Text style={styles.padaPopupLabel}>
                      Zone: <Text style={styles.padaPopupValue}>{selectedPada.zone}</Text>
                    </Text>
                  )}
                  <Text style={styles.padaPopupLabel}>
                    Energy: <Text style={styles.padaPopupValue}>{selectedPada.energy}</Text>
                  </Text>
                  <Text style={styles.padaPopupDescription}>{selectedPada.description}</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
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
  padaPopupContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  padaPopupContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: width * 0.85,
    maxHeight: height * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  padaPopupScrollView: {
    maxHeight: height * 0.6,
  },
  padaPopupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#F4C430',
  },
  padaPopupTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2328',
    flex: 1,
  },
  padaPopupCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  padaPopupCloseText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  padaPopupBody: {
    marginTop: 10,
  },
  padaPopupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  padaPopupValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4C430',
  },
  padaPopupDescription: {
    fontSize: 14,
    color: '#1F2328',
    lineHeight: 22,
    marginTop: 10,
  },
});

