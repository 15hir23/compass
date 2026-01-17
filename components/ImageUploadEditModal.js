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
  Alert,
  ScrollView,
  PanResponder,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Svg, Path, Line, Circle, Rect, Text as SvgText, Polygon, G } from 'react-native-svg';
import { CompassToggleIcon, DownloadIcon, ImageIcon, SaveIcon, ChangeIcon, CameraIcon } from './svgs';

// Manual Rotation Icon Component
const ManualRotationIcon = ({ size = 20, color = "#FFFFFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <Path
      d="M12 6v6l4 2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M16 8l-2-2 2-2M8 8l2-2-2-2"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);
import CompassView from './CompassView';
import { GRID_STRUCTURE } from '../utils/gridStructure';
import { VASTU_GRID_9X9 } from '../utils/vastuGrid';
import { translateDevta } from '../utils/i18n';
import { useI18n } from '../utils/i18n';
import { saveImage } from '../utils/imageStorage';

// Helper function to get cardinal direction
const getCardinalDirection = (degree) => {
  if (degree >= 337.5 || degree < 22.5) return 'N';
  if (degree >= 22.5 && degree < 67.5) return 'NE';
  if (degree >= 67.5 && degree < 112.5) return 'E';
  if (degree >= 112.5 && degree < 157.5) return 'SE';
  if (degree >= 157.5 && degree < 202.5) return 'S';
  if (degree >= 202.5 && degree < 247.5) return 'SW';
  if (degree >= 247.5 && degree < 292.5) return 'W';
  if (degree >= 292.5 && degree < 337.5) return 'NW';
  return 'N';
};

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

export default function ImageUploadEditModal({ 
  visible, 
  mode, 
  heading, 
  onClose, 
  onSave,
  compassType = 'vastu',
  initialGridState = false,
  enableGridAfterPick = false,
  onOpen
}) {
  const { language } = useI18n();
  const { width: screenWidth, height: screenHeight } = getDimensions();
  const scale = useSharedValue(0);
  const imageContainerRef = useRef(null);
  
  // Image state
  const [imageUri, setImageUri] = useState(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageScale, setImageScale] = useState(1);
  const [imageTranslateX, setImageTranslateX] = useState(0);
  const [imageTranslateY, setImageTranslateY] = useState(0);
  
  // Rotation controls
  const [rotationInput, setRotationInput] = useState('0');
  const [showRotationControls, setShowRotationControls] = useState(false);
  const [showManualPanel, setShowManualPanel] = useState(false);
  
  // Grid & Compass Controls
  const [showCompass, setShowCompass] = useState(false);
  const [showVastuGrid, setShowVastuGrid] = useState(initialGridState);
  const [showOuterLayer, setShowOuterLayer] = useState(true);
  const [showMiddleLayer, setShowMiddleLayer] = useState(true);
  const [showCenterLayer, setShowCenterLayer] = useState(true);
  
  // Pada popup state
  const [selectedPada, setSelectedPada] = useState(null);
  
  // Grid corners
  const [gridCorners, setGridCorners] = useState(() => {
    const marginX = screenWidth * 0.05;
    const topMargin = Math.max(screenHeight * 0.10, 70);
    const bottomMargin = Math.max(screenHeight * 0.20, 150);
    return [
      { x: marginX, y: topMargin },
      { x: screenWidth - marginX, y: topMargin },
      { x: screenWidth - marginX, y: screenHeight - bottomMargin },
      { x: marginX, y: screenHeight - bottomMargin },
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

  // Pan responder state
  const panState = useRef({
    lastX: 0,
    lastY: 0,
    isPanning: false,
  });

  // Pan responder for image panning
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        panState.current.isPanning = true;
        panState.current.lastX = imageTranslateX;
        panState.current.lastY = imageTranslateY;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (panState.current.isPanning) {
          setImageTranslateX(panState.current.lastX + gestureState.dx);
          setImageTranslateY(panState.current.lastY + gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        panState.current.isPanning = false;
      },
    })
  ).current;
  
  // Slider state
  const [sliderLayout, setSliderLayout] = useState({ width: 0 });
  const sliderState = useRef({
    isDragging: false,
    startX: 0,
    startRotation: 0,
  });
  
  // Helper function to get X position from event (works for both touch and mouse)
  const getEventX = (evt, containerRef) => {
    if (Platform.OS === 'web') {
      // For web, use clientX relative to the container
      if (containerRef && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        return evt.clientX - rect.left;
      }
      return evt.nativeEvent?.clientX || evt.clientX || 0;
    } else {
      // For native, use locationX or pageX
      const touch = evt.nativeEvent?.touches?.[0] || evt.nativeEvent;
      return touch.locationX || touch.pageX || 0;
    }
  };

  // Pan responder for rotation slider
  const sliderContainerRef = useRef(null);
  const sliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        sliderState.current.isDragging = true;
        const x = getEventX(evt, sliderContainerRef);
        sliderState.current.startX = x;
        sliderState.current.startRotation = imageRotation;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (sliderState.current.isDragging && sliderLayout.width > 0) {
          let currentX;
          if (Platform.OS === 'web') {
            // For web, calculate from gestureState.dx
            currentX = sliderState.current.startX + gestureState.dx;
          } else {
            // For native, use locationX
            const touch = evt.nativeEvent?.touches?.[0] || evt.nativeEvent;
            currentX = touch.locationX || (sliderState.current.startX + gestureState.dx) || 0;
          }
          const relativeX = Math.max(0, Math.min(sliderLayout.width, currentX));
          const percent = relativeX / sliderLayout.width;
          const newRotation = Math.round(percent * 360);
          handleRotationChange(newRotation);
        }
      },
      onPanResponderRelease: () => {
        sliderState.current.isDragging = false;
      },
    })
  ).current;

  // Web-specific mouse event handlers
  const handleMouseDown = (evt) => {
    if (Platform.OS === 'web' && sliderContainerRef.current) {
      evt.preventDefault();
      sliderState.current.isDragging = true;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const currentX = evt.clientX - rect.left;
      sliderState.current.startX = currentX;
      sliderState.current.startRotation = imageRotation;
      
      // Update rotation immediately on click
      const relativeX = Math.max(0, Math.min(sliderLayout.width, currentX));
      const percent = relativeX / sliderLayout.width;
      const newRotation = Math.round(percent * 360);
      handleRotationChange(newRotation);
    }
  };

  const handleMouseMove = (evt) => {
    if (Platform.OS === 'web' && sliderState.current.isDragging && sliderLayout.width > 0 && sliderContainerRef.current) {
      evt.preventDefault();
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const currentX = evt.clientX - rect.left;
      const relativeX = Math.max(0, Math.min(sliderLayout.width, currentX));
      const percent = relativeX / sliderLayout.width;
      const newRotation = Math.round(percent * 360);
      handleRotationChange(newRotation);
    }
  };

  const handleMouseUp = () => {
    if (Platform.OS === 'web') {
      sliderState.current.isDragging = false;
    }
  };

  // Add global mouse event listeners for web
  React.useEffect(() => {
    if (Platform.OS === 'web' && showRotationControls) {
      const handleGlobalMouseMove = (evt) => {
        if (sliderState.current.isDragging) {
          handleMouseMove(evt);
        }
      };
      const handleGlobalMouseUp = () => {
        handleMouseUp();
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [showRotationControls, sliderLayout.width]);

  // Zoom functions
  const zoomIn = () => {
    setImageScale((prev) => Math.min(prev + 0.1, 3));
  };

  const zoomOut = () => {
    setImageScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  // Update corners when screen dimensions change
  React.useEffect(() => {
    const marginX = screenWidth * 0.05;
    const topMargin = Math.max(screenHeight * 0.10, 70);
    const bottomMargin = Math.max(screenHeight * 0.20, 150);
    setGridCorners([
      { x: marginX, y: topMargin },
      { x: screenWidth - marginX, y: topMargin },
      { x: screenWidth - marginX, y: screenHeight - bottomMargin },
      { x: marginX, y: screenHeight - bottomMargin },
    ]);
  }, [screenWidth, screenHeight]);

  React.useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
      // Reset image state when opening to ensure clean state
      setImageUri(null);
      setImageRotation(0);
      setImageScale(1);
      setImageTranslateX(0);
      setImageTranslateY(0);
      setRotationInput('0');
      setShowCompass(false);
      // Only reset grid if not opening with initial grid state
      if (!initialGridState) {
        setShowVastuGrid(false);
      } else {
        setShowVastuGrid(true);
        // Call onOpen callback after component is mounted
        if (onOpen) {
          setTimeout(() => {
            onOpen();
          }, 100);
        }
      }
      setShowOuterLayer(true);
      setShowMiddleLayer(true);
      setShowCenterLayer(true);
      setSelectedPada(null);
      setShowRotationControls(false);
    } else {
      scale.value = 0;
      // Reset image state when closing
      setImageUri(null);
      setImageRotation(0);
      setImageScale(1);
      setImageTranslateX(0);
      setImageTranslateY(0);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: scale.value,
    };
  });

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        // Clear previous image state
        setImageUri(null);
        setImageRotation(0);
        setImageScale(1);
        setImageTranslateX(0);
        setImageTranslateY(0);
        setShowCompass(false);
        // Enable grid if enableGridAfterPick is true (opened from sidebar)
        setShowVastuGrid(enableGridAfterPick);
        setShowOuterLayer(true);
        setShowMiddleLayer(true);
        setShowCenterLayer(true);
        setSelectedPada(null);
        
        // Reset grid corners to default
        const marginX = screenWidth * 0.05;
        const topMargin = Math.max(screenHeight * 0.10, 70);
        const bottomMargin = Math.max(screenHeight * 0.20, 150);
        setGridCorners([
          { x: marginX, y: topMargin },
          { x: screenWidth - marginX, y: topMargin },
          { x: screenWidth - marginX, y: screenHeight - bottomMargin },
          { x: marginX, y: screenHeight - bottomMargin },
        ]);
        
        // Set new image after clearing
        setTimeout(() => {
          setImageUri(result.assets[0].uri);
        }, 100);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Rotate image (90 degree increments)
  const rotateImage = () => {
    setImageRotation((prev) => (prev + 90) % 360);
    setRotationInput(String((imageRotation + 90) % 360));
  };
  
  // Manual rotation via slider
  const handleRotationChange = (value) => {
    const newRotation = Math.round(value);
    setImageRotation(newRotation);
    setRotationInput(String(newRotation));
  };
  
  // Sync rotation input when rotation changes externally
  React.useEffect(() => {
    setRotationInput(String(Math.round(imageRotation)));
  }, [imageRotation]);
  
  // Set rotation by degree input
  const handleRotationInputChange = (text) => {
    setRotationInput(text);
  };
  
  // Apply rotation from input
  const applyRotationInput = () => {
    const degreeValue = parseFloat(rotationInput);
    if (!isNaN(degreeValue)) {
      // Normalize to 0-360 range
      let normalizedRotation = degreeValue % 360;
      if (normalizedRotation < 0) {
        normalizedRotation += 360;
      }
      setImageRotation(normalizedRotation);
      setRotationInput(String(Math.round(normalizedRotation)));
    } else {
      // Reset to current rotation if invalid
      setRotationInput(String(Math.round(imageRotation)));
    }
  };

  // Reset image transform
  const resetImageTransform = () => {
    setImageRotation(0);
    setImageScale(1);
    setImageTranslateX(0);
    setImageTranslateY(0);
    setRotationInput('0');
  };

  // Capture image with compass and grid
  const captureImageWithCompass = async () => {
    try {
      if (Platform.OS === 'web') {
        const html2canvas = (await import('html2canvas')).default;
        const element = imageContainerRef.current;
        
        if (!element) {
          throw new Error('Image container not found');
        }
        
        const canvas = await html2canvas(element, {
          backgroundColor: null,
          scale: 2,
          logging: false,
        });
        
        return canvas.toDataURL('image/jpeg', 1.0);
      } else {
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

  // Save image to storage (without download)
  const saveImageToStorage = async () => {
    if (!imageUri) {
      return false;
    }

    try {
      // Capture image with grid and compass overlays (if enabled)
      const capturedUri = await captureImageWithCompass();
      
      // Save to app storage
      await saveImage(capturedUri, mode, heading);
      
      if (onSave) {
        onSave(capturedUri);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving image:', error);
      return false;
    }
  };

  // Handle save and download
  const handleSave = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please upload an image first');
      return;
    }

    try {
      // Capture image with grid and compass overlays (if enabled)
      const capturedUri = await captureImageWithCompass();
      
      // Save to app storage
      await saveImage(capturedUri, mode, heading);
      
      // Download/save to device
      if (Platform.OS === 'web') {
        // For web, create a download link
        const link = document.createElement('a');
        link.href = capturedUri;
        link.download = `compass-upload-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For mobile, save to media library
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(capturedUri);
        } else {
          Alert.alert('Permission Required', 'Please grant media library permission to save images');
          return;
        }
      }
      
      if (onSave) {
        onSave(capturedUri);
      }
      
      Alert.alert('Success', Platform.OS === 'web' ? 'Image saved and downloaded successfully!' : 'Image saved to gallery!');
      onClose();
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  // Handle back button - save to last captured before closing
  const handleBack = async () => {
    if (imageUri) {
      // Save image to storage before closing
      await saveImageToStorage();
    }
    onClose();
  };

  // Pada descriptions (same as CapturedImageModal)
  const padaDescriptions = {
    'Rog': 'Rog pada represents the wind element. Ideal for ventilation, air circulation, and maintaining fresh energy flow. Best for windows, doors, or open spaces.',
    'Nag': 'Nag pada is associated with serpents and hidden energies. Should be kept clean and avoid heavy construction. Suitable for storage or utility areas.',
    'Mukhya': 'Mukhya pada means "chief" or "main". Represents leadership and authority. Good for main entrances or important rooms. Maintains positive energy flow.',
    'Bhalla': 'Bhalla pada is neutral in nature. Can be used for general purposes. Avoid placing heavy objects or creating obstructions here.',
    'Soma': 'Soma pada represents the moon (चंद्र). Very positive energy. Excellent for bedrooms, meditation areas, and places requiring peace and tranquility.',
    'Bhujang': 'Bhujang pada is neutral. Suitable for general living spaces. Keep this area clean and well-maintained for balanced energy.',
    'Aditi': 'Aditi pada is very positive, representing the mother goddess. Ideal for kitchen, dining areas, or spaces where family gathers. Promotes harmony.',
    'Diti': 'Diti pada is positive and represents upward energy. Good for study rooms, libraries, or areas requiring mental clarity and focus.',
    'Shikhi': 'Shikhi pada is very positive, representing the divine. Excellent for prayer rooms, meditation spaces, or spiritual areas. Maintains purity and peace.',
    'Papa Yaksha': 'Papa Yaksha pada is negative. Should be kept clean, avoid heavy construction. Best for storage or utility areas. Requires remedies if used for living spaces.',
    'Rudrajay': 'Rudrajay pada is neutral. Represents transformation and change. Suitable for transitional spaces or areas that need periodic renewal.',
    'Prithvidhara': 'Prithvidhara pada is positive and represents earth element. Excellent for foundation, storage, or areas requiring stability. Good for heavy furniture placement.',
    'Aap': 'Aap pada is very positive, representing water element. Ideal for bathrooms, water features, or areas related to purification. Promotes flow and prosperity.',
    'Parjanya': 'Parjanya pada is positive, representing rain and fertility. Good for gardens, plants, or areas requiring growth and abundance.',
    'Sosha': 'Sosha pada is negative, meaning "drying" or "withering". Should be kept clean and avoid placing important items here. Best for utility or storage.',
    'Rudra': 'Rudra pada is neutral. Represents transformation and change. Suitable for areas that need periodic renewal or modification.',
    'Aapvatsa': 'Aapvatsa (आपवत्स), also known as Uma (उमा), is the embodiment of Goddess Parvati, the consort of Lord Shiva. This pada represents the Goddess of Creative Power, Marriage, Children, Fertility, Beauty, Purity, Energy, Love, and Devotion. Located in the Northeast (NE) direction, ruled by planet Ketu, and associated with Career attributes. Aapvatsa brings ideas and carries them towards practical application. This zone is ideal for areas related to nutrition, creativity, and feminine energy. If this zone has problems, the womenfolk of the house may suffer. Keep this area clean, positive, and well-maintained to harness the divine feminine energy of Parvati.',
    'Jayanta': 'Jayanta pada is positive, meaning "victorious". Excellent for study rooms, offices, or areas requiring success and achievement.',
    'Asura': 'Asura pada is negative, representing negative forces. Should be kept clean and minimal. Avoid placing important rooms here. Requires Vastu remedies.',
    'Mitra': 'Mitra pada is positive, meaning "friend". Excellent for living rooms, guest areas, or spaces for social interaction. Promotes friendship and harmony.',
    'Brahma': 'Brahma pada is divine, representing the creator. This is the most sacred center (Brahmasthan). Should remain open and uncluttered. Never place heavy objects, pillars, or construction here. Ideal for meditation or open space.',
    'Aryama': 'Aryama pada is positive, representing the sun and leadership. Excellent for master bedrooms, offices, or areas requiring authority and respect.',
    'Mahendra': 'Mahendra pada is very positive, representing Indra (king of gods). Ideal for main entrances, living rooms, or important spaces. Promotes prosperity and power.',
    'Varuna': 'Varuna pada represents the water god (वरुण). Suitable for bathrooms, water-related areas, and spaces requiring purification.',
    'Surya': 'Surya pada represents the sun (सूर्य). Excellent for east-facing rooms, study areas, and spaces requiring energy and vitality.',
    'Pushpadanta': 'Pushpadanta pada is positive, meaning "flower-toothed". Good for decorative areas, gardens, or spaces requiring beauty and aesthetics.',
    'Satya': 'Satya pada is positive, meaning "truthful". Excellent for study rooms, libraries, or areas requiring honesty and clarity of thought.',
    'Sugriva': 'Sugriva pada is neutral. Represents strength and courage. Suitable for areas requiring determination and willpower.',
    'Indraraj': 'Indraraj pada is positive, representing the king of gods. Excellent for master bedrooms, offices, or areas requiring leadership and authority.',
    'Vivaswan': 'Vivaswan pada is positive, representing the sun god. Ideal for east-facing rooms, study areas, or spaces requiring brightness and energy.',
    'Svitra': 'Svitra pada is positive. Represents purity and cleanliness. Good for bathrooms, kitchens, or areas requiring hygiene.',
    'Bhrusha': 'Bhrusha pada is neutral. Suitable for general purposes. Keep clean and well-maintained for balanced energy flow.',
    'Dwarika': 'Dwarika pada is neutral. Represents gatekeepers. Suitable for entrance areas, doorways, or transitional spaces.',
    'Indra': 'Indra pada is positive, representing the king of gods. Excellent for important rooms, offices, or areas requiring power and prosperity.',
    'Savitra': 'Savitra pada is positive, representing the sun. Ideal for east-facing areas, study rooms, or spaces requiring illumination and knowledge.',
    'Aakash': 'Aakash pada is neutral, representing space or sky. Suitable for open areas, balconies, or spaces requiring openness and freedom.',
    'Pitru Gana': 'Pitru Gana pada is negative, representing ancestors. Should be kept clean and respectful. Avoid placing bedrooms or important rooms here. Best for storage.',
    'Mriga': 'Mriga pada is neutral, representing deer. Suitable for general purposes. Keep clean and avoid heavy construction.',
    'Bhringaraj': 'Bhringaraj pada is negative, representing serpents. Should be kept minimal and clean. Avoid important placements. Requires Vastu remedies.',
    'Gandharva': 'Gandharva pada is neutral, representing celestial musicians. Suitable for entertainment areas, music rooms, or spaces for creativity.',
    'Yama': 'Yama pada represents death (यम). Keep clean and minimal. Avoid placing bedrooms or important rooms here. Best for storage or utility.',
    'Bhratsata': 'Bhratsata pada is neutral. Suitable for general purposes. Keep clean and well-maintained.',
    'Vitath': 'Vitath pada is neutral. Represents falsehood or illusion. Should be kept clean. Avoid placing important items here.',
    'Pusha': 'Pusha pada is positive, representing nourishment. Good for kitchens, dining areas, or spaces related to food and sustenance.',
    'Agni': 'Agni pada is positive, representing fire. Excellent for kitchens, fireplaces, or areas requiring heat and transformation. Promotes energy and activity.',
  };

  const handlePadaClick = (devtaName, devtaInfo, translatedName) => {
    setSelectedPada({
      name: translatedName,
      devta: devtaName,
      zone: devtaInfo?.zone || '',
      energy: devtaInfo?.energy || 'neutral',
      description: padaDescriptions[devtaName] || `${translatedName} pada represents a specific energy in Vastu Shastra. Each pada has unique characteristics and should be used appropriately based on its energy type.`
    });
  };

  // Helper function to get cell center point
  const getCellCenter = (row, col) => {
    const rowT = row / 9;
    const colT = col / 9;
    
    const topX = gridCorners[0].x + (gridCorners[1].x - gridCorners[0].x) * colT;
    const topY = gridCorners[0].y + (gridCorners[1].y - gridCorners[0].y) * colT;
    
    const bottomX = gridCorners[3].x + (gridCorners[2].x - gridCorners[3].x) * colT;
    const bottomY = gridCorners[3].y + (gridCorners[2].y - gridCorners[3].y) * colT;
    
    const x = topX + (bottomX - topX) * rowT;
    const y = topY + (bottomY - topY) * rowT;
    
    return { x, y };
  };

  const getCellCorners = (row, col, rowSpan, colSpan) => {
    const tl = getCellCenter(row, col);
    const tr = getCellCenter(row, col + colSpan);
    const br = getCellCenter(row + rowSpan, col + colSpan);
    const bl = getCellCenter(row + rowSpan, col);
    return { tl, tr, br, bl };
  };

  const getGridPoint = (rowT, colT) => {
    if (gridCorners.length !== 4) return { x: 0, y: 0 };
    
    const tl = gridCorners[0];
    const tr = gridCorners[1];
    const br = gridCorners[2];
    const bl = gridCorners[3];
    
    const bottomX = bl.x + (br.x - bl.x) * colT;
    const bottomY = bl.y + (br.y - bl.y) * colT;
    
    const topX = tl.x + (tr.x - tl.x) * colT;
    const topY = tl.y + (tr.y - tl.y) * colT;
    
    const x = topX + (bottomX - topX) * rowT;
    const y = topY + (bottomY - topY) * rowT;
    
    return { x, y };
  };

  if (!visible) {
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
            {/* Top Bar with Back button, Direction Indicator, and Zoom Controls */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.goBackButton}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#F4C430', '#FFD700']}
                  style={styles.goBackButtonGradient}
                >
                  <Text style={styles.goBackButtonText}>← Back</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Center: Direction Indicator */}
              {heading !== undefined && heading !== null && (
                <View style={styles.directionIndicator}>
                  {/* Up Arrow */}
                  <Text style={styles.upArrow}>↑</Text>
                  {/* Current Direction Label - Right of arrow */}
                  <Text style={styles.directionLabel}>{getCardinalDirection(heading)}</Text>
                </View>
              )}
              
              {/* Zoom Controls - Centered horizontally */}
              {imageUri && (
                <View style={styles.zoomControls}>
                  <TouchableOpacity
                    style={styles.zoomButton}
                    onPress={zoomIn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.zoomButtonText}>+</Text>
                  </TouchableOpacity>
                  <View style={styles.zoomIndicator}>
                    <Text style={styles.zoomIndicatorText}>
                      {Math.round(imageScale * 100)}%
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.zoomButton}
                    onPress={zoomOut}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.zoomButtonText}>−</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Spacer to balance the layout */}
              {imageUri && <View style={styles.topBarSpacer} />}
            </View>

            {/* Image container */}
            <View 
              ref={imageContainerRef}
              style={[styles.imageContainer, StyleSheet.absoluteFill]}
            >
              {imageUri ? (
                <View 
                  style={StyleSheet.absoluteFill}
                  {...panResponder.panHandlers}
                >
                  <Image 
                    source={{ uri: imageUri }} 
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        transform: [
                          { rotate: `${imageRotation}deg` },
                          { scale: imageScale },
                          { translateX: imageTranslateX },
                          { translateY: imageTranslateY },
                        ],
                      },
                    ]}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={styles.uploadPrompt}>
                  <Text style={styles.uploadPromptText}>Upload an image to get started</Text>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={pickImage}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F4C430', '#FFD700']}
                      style={styles.uploadButtonGradient}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: getResponsiveSize(8) }}>
                        <CameraIcon size={getResponsiveSize(18)} color="#FFFFFF" />
                        <Text style={styles.uploadButtonText}>Upload Image</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Grid overlay */}
              <Svg style={styles.gridOverlay} width={screenWidth} height={screenHeight}>
                {gridCorners.length === 4 && (() => {
                  // Calculate center point for rotation
                  const centerX = (gridCorners[0].x + gridCorners[1].x + gridCorners[2].x + gridCorners[3].x) / 4;
                  const centerY = (gridCorners[0].y + gridCorners[1].y + gridCorners[2].y + gridCorners[3].y) / 4;
                  
                  return (
                    <G transform={`rotate(${imageRotation} ${centerX} ${centerY})`}>
                      <Polygon
                        points={`${gridCorners[0].x},${gridCorners[0].y} ${gridCorners[1].x},${gridCorners[1].y} ${gridCorners[2].x},${gridCorners[2].y} ${gridCorners[3].x},${gridCorners[3].y}`}
                        fill="none"
                        stroke="#FFD700"
                        strokeWidth="5"
                      />
                    </G>
                  );
                })()}
                
                {showVastuGrid && gridCorners.length === 4 && (() => {
                  // Calculate center point for rotation
                  const centerX = (gridCorners[0].x + gridCorners[1].x + gridCorners[2].x + gridCorners[3].x) / 4;
                  const centerY = (gridCorners[0].y + gridCorners[1].y + gridCorners[2].y + gridCorners[3].y) / 4;
                  
                  return (
                    <G transform={`rotate(${imageRotation} ${centerX} ${centerY})`}>
                  <>
                    {[1/3, 2/3].map((fraction, i) => {
                      const topPoint = getGridPoint(0, fraction);
                      const bottomPoint = getGridPoint(1, fraction);
                      const leftPoint = getGridPoint(fraction, 0);
                      const rightPoint = getGridPoint(fraction, 1);
                      
                      return (
                        <React.Fragment key={`grid-${i}`}>
                          <Line
                            x1={topPoint.x}
                            y1={topPoint.y}
                            x2={bottomPoint.x}
                            y2={bottomPoint.y}
                            stroke="#F4C430"
                            strokeWidth="3"
                            opacity="0.9"
                          />
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
                    
                    {GRID_STRUCTURE.map((cell) => {
                      const isOuter = cell.row === 0 || cell.row === 8 || cell.col === 0 || cell.col === 8;
                      const isCenter = cell.name === 'Brahma';
                      const isMiddle = !isOuter && !isCenter;
                      
                      if (isOuter && !showOuterLayer) return null;
                      if (isMiddle && !showMiddleLayer) return null;
                      if (isCenter && !showCenterLayer) return null;
                      
                      const tl = getGridPoint(cell.row / 9, cell.col / 9);
                      const tr = getGridPoint(cell.row / 9, (cell.col + cell.colSpan) / 9);
                      const br = getGridPoint((cell.row + cell.rowSpan) / 9, (cell.col + cell.colSpan) / 9);
                      const bl = getGridPoint((cell.row + cell.rowSpan) / 9, cell.col / 9);
                      
                      const devtaInfo = VASTU_GRID_9X9[cell.row]?.[cell.col] || { 
                        devta: cell.name, 
                        zone: '', 
                        energy: 'neutral', 
                        color: '#87CEEB' 
                      };
                      
                      let fillColor = devtaInfo.color || '#87CEEB';
                      let strokeColor = fillColor;
                      if (cell.name === 'Brahma') {
                        fillColor = '#FFE87C';
                        strokeColor = '#FFC125';
                      }
                      
                      let strokeWidth = 2;
                      const spanFactor = cell.rowSpan + cell.colSpan;
                      if (cell.name === 'Brahma') {
                        strokeWidth = 4;
                      } else if (spanFactor > 3) {
                        strokeWidth = 3;
                      }
                      
                      return (
                        <Polygon
                          key={`cell-${cell.row}-${cell.col}-${cell.name}`}
                          points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`}
                          fill={fillColor}
                          fillOpacity={0.2}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          strokeOpacity={0.8}
                        />
                      );
                    })}
                    
                    {GRID_STRUCTURE.map((cell) => {
                      const isOuter = cell.row === 0 || cell.row === 8 || cell.col === 0 || cell.col === 8;
                      const isCenter = cell.name === 'Brahma';
                      const isMiddle = !isOuter && !isCenter;
                      
                      if (isOuter && !showOuterLayer) return null;
                      if (isMiddle && !showMiddleLayer) return null;
                      if (isCenter && !showCenterLayer) return null;
                      if (cell.name === 'Brahma') return null;
                      
                      const centerRowT = (cell.row + cell.rowSpan / 2) / 9;
                      const centerColT = (cell.col + cell.colSpan / 2) / 9;
                      const center = getGridPoint(centerRowT, centerColT);
                      
                      const devtaInfo = VASTU_GRID_9X9[cell.row]?.[cell.col] || { 
                        devta: cell.name, 
                        zone: '', 
                        energy: 'neutral', 
                        color: '#87CEEB' 
                      };
                      
                      const translatedName = translateDevta(cell.name, language || 'en');
                      
                      let fontSize = 9;
                      let fontWeight = 'bold';
                      let padding = 3;
                      let borderRadius = 4;
                      
                      const spanFactor = cell.rowSpan + cell.colSpan;
                      
                      if (cell.name === 'Prithvidhara' || cell.name === 'Vivaswan') {
                        fontSize = 14;
                        fontWeight = '800';
                        padding = 5;
                        borderRadius = 6;
                      } else if (cell.name === 'Mitra' || cell.name === 'Aryama') {
                        fontSize = 13;
                        fontWeight = '800';
                        padding = 4;
                        borderRadius = 6;
                      } else if (spanFactor === 3) {
                        fontSize = 11;
                        fontWeight = '700';
                        padding = 3;
                      }
                      
                      const textColor = '#654321';
                      const borderColor = '#B8860B';
                      const bgColor = devtaInfo.color || '#87CEEB';
                      
                      const uppercaseName = translatedName.toUpperCase();
                      const charWidthMultiplier = fontWeight === '900' ? 0.7 : fontWeight === '800' ? 0.68 : fontWeight === '700' ? 0.65 : 0.6;
                      const avgCharWidth = fontSize * charWidthMultiplier;
                      let textWidth = uppercaseName.length * avgCharWidth;
                      
                      if (uppercaseName.length > 8) {
                        textWidth *= 1.15;
                      } else if (uppercaseName.length > 6) {
                        textWidth *= 1.1;
                      }
                      
                      const textHeight = fontSize * 1.3;
                      const baseHorizontalPadding = padding * 1.8;
                      const baseVerticalPadding = padding * 1.3;
                      const extraPadding = uppercaseName.length > 8 ? padding * 0.5 : uppercaseName.length > 6 ? padding * 0.3 : 0;
                      const horizontalPadding = baseHorizontalPadding + extraPadding;
                      const verticalPadding = baseVerticalPadding;
                      
                      const boxWidth = Math.max(textWidth + (horizontalPadding * 2), fontSize * 2.5);
                      const boxHeight = textHeight + (verticalPadding * 2);
                      
                      const cellLeft = getGridPoint(cell.row / 9, cell.col / 9);
                      const cellRight = getGridPoint(cell.row / 9, (cell.col + cell.colSpan) / 9);
                      const cellWidth = Math.abs(cellRight.x - cellLeft.x);
                      const minGap = fontSize * 0.4;
                      const maxBoxWidth = cellWidth - (minGap * 2);
                      const finalBoxWidth = Math.min(boxWidth, maxBoxWidth);
                      
                      return (
                        <G key={`pada-label-${cell.row}-${cell.col}-${cell.name}`}>
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
                            {uppercaseName}
                          </SvgText>
                        </G>
                      );
                    })}
                  </>
                    </G>
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
              
              {/* Compass Overlay */}
              {showCompass && imageUri && (
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
            
            {/* Action buttons */}
            <View style={styles.actionButtons}>
              {!imageUri ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionButtonContent}>
                    <CameraIcon size={getResponsiveSize(16)} color="#B8860B" />
                    <Text style={styles.actionButtonText}>Upload</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <>
                  {/* Edit buttons */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={pickImage}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionButtonContent}>
                      <ChangeIcon size={getResponsiveSize(16)} color="#B8860B" />
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, showRotationControls && styles.actionButtonActive]}
                    onPress={() => {
                      // Quick rotate by 90 degrees
                      rotateImage();
                      // Show manual button option
                      setShowRotationControls(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionButtonContent}>
                      <Text style={styles.actionButtonText}>↻ Rotate</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Manual Rotation Option - shown when Rotate is clicked */}
                  {showRotationControls && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.manualRotationButton, showManualPanel && styles.actionButtonActive]}
                      onPress={() => {
                        // Toggle manual panel
                        setShowManualPanel(!showManualPanel);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.actionButtonContent}>
                        <ManualRotationIcon size={getResponsiveSize(16)} color="#B8860B" />
                        <Text style={styles.actionButtonText}>Manual</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={resetImageTransform}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionButtonContent}>
                      <Text style={styles.actionButtonText}>↺ Reset</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Compass toggle */}
                  <TouchableOpacity
                    style={[styles.actionButton, showCompass && styles.actionButtonActive]}
                    onPress={() => setShowCompass(!showCompass)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionButtonContent}>
                      <CompassToggleIcon size={getResponsiveSize(16)} color={showCompass ? "#F4C430" : "#B8860B"} />
                    </View>
                  </TouchableOpacity>
                  
                  {/* Grid toggle */}
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
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, showOuterLayer && styles.actionButtonActive]}
                        onPress={() => setShowOuterLayer(!showOuterLayer)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.actionButtonContent}>
                          <Text style={styles.actionButtonText}>O</Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, showMiddleLayer && styles.actionButtonActive]}
                        onPress={() => setShowMiddleLayer(!showMiddleLayer)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.actionButtonContent}>
                          <Text style={styles.actionButtonText}>M</Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, showCenterLayer && styles.actionButtonActive]}
                        onPress={() => setShowCenterLayer(!showCenterLayer)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.actionButtonContent}>
                          <Text style={styles.actionButtonText}>C</Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {/* Save button */}
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F4C430', '#FFD700']}
                      style={styles.saveButtonGradient}
                    >
                      <SaveIcon size={getResponsiveSize(16)} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            {/* Manual Rotation Controls Panel */}
            {showManualPanel && imageUri && (
              <View style={styles.rotationControlsPanel}>
                <View style={styles.rotationControlsContent}>
                  <View style={styles.rotationControlsHeader}>
                    <Text style={styles.rotationControlsTitle}>Manual Rotation</Text>
                    <TouchableOpacity
                      style={styles.rotationControlsCloseButton}
                      onPress={() => setShowManualPanel(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.rotationControlsCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Degree Input */}
                  <View style={styles.rotationInputContainer}>
                    <Text style={styles.rotationInputLabel}>Enter Degrees:</Text>
                    <View style={styles.rotationInputRow}>
                      <TextInput
                        style={styles.rotationInput}
                        value={rotationInput}
                        onChangeText={handleRotationInputChange}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#999"
                        onSubmitEditing={applyRotationInput}
                      />
                      <TouchableOpacity
                        style={styles.rotationApplyButton}
                        onPress={applyRotationInput}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.rotationApplyButtonText}>Set</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Rotation Slider */}
                  <View style={styles.rotationSliderContainer}>
                    <Text style={styles.rotationSliderLabel}>
                      Rotation: {Math.round(imageRotation)}°
                    </Text>
                    <View style={styles.rotationSliderWrapper}>
                      <Text style={styles.rotationSliderMin}>0°</Text>
                      <View 
                        ref={sliderContainerRef}
                        style={styles.rotationSliderTrack}
                        {...(Platform.OS === 'web' ? {} : sliderPanResponder.panHandlers)}
                        {...(Platform.OS === 'web' ? {
                          onMouseDown: handleMouseDown,
                        } : {})}
                        onLayout={(event) => {
                          const { width } = event.nativeEvent.layout;
                          setSliderLayout({ width });
                        }}
                      >
                        <View 
                          style={[
                            styles.rotationSliderFill, 
                            { width: `${(imageRotation / 360) * 100}%` }
                          ]} 
                        />
                        <View
                          style={[
                            styles.rotationSliderThumb,
                            { left: `${(imageRotation / 360) * 100}%` }
                          ]}
                        />
                      </View>
                      <Text style={styles.rotationSliderMax}>360°</Text>
                    </View>
                    <View style={styles.rotationSliderButtons}>
                      <TouchableOpacity
                        style={styles.rotationSliderButton}
                        onPress={() => handleRotationChange(Math.max(0, imageRotation - 1))}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.rotationSliderButtonText}>−1°</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rotationSliderButton}
                        onPress={() => handleRotationChange(Math.min(360, imageRotation + 1))}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.rotationSliderButtonText}>+1°</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rotationSliderButton}
                        onPress={() => handleRotationChange(Math.max(0, imageRotation - 5))}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.rotationSliderButtonText}>−5°</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rotationSliderButton}
                        onPress={() => handleRotationChange(Math.min(360, imageRotation + 5))}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.rotationSliderButtonText}>+5°</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
            </View>
            )}
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
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  goBackButton: {
    zIndex: 100,
  },
  topBarSpacer: {
    width: getResponsiveSize(80), // Same width as back button to center zoom controls
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
  uploadPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  uploadPromptText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(18),
    marginBottom: getResponsiveSize(20),
    fontWeight: '600',
  },
  uploadButton: {
    borderRadius: getResponsiveSize(20),
    overflow: 'hidden',
    elevation: 6,
  },
  uploadButtonGradient: {
    paddingVertical: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(16),
    fontWeight: '700',
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
  actionButtonActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.2)',
    borderColor: '#F4C430',
    borderWidth: 2,
  },
  manualRotationButton: {
    marginLeft: getResponsiveSize(4),
  },
  actionButtonText: {
    color: '#B8860B',
    fontSize: getResponsiveSize(12),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  saveButton: {
    borderRadius: getResponsiveSize(16),
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  saveButtonGradient: {
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveSize(6),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(14),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(6),
    zIndex: 1000,
    elevation: 1000,
  },
  zoomButton: {
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    borderRadius: getResponsiveSize(16),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E2D6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  zoomButtonText: {
    color: '#3B2F2F',
    fontSize: getResponsiveSize(20),
    fontWeight: '900',
    lineHeight: getResponsiveSize(20),
  },
  zoomIndicator: {
    minWidth: getResponsiveSize(45),
    paddingHorizontal: getResponsiveSize(10),
    paddingVertical: getResponsiveSize(5),
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(14),
    borderWidth: 1,
    borderColor: '#E9E2D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomIndicatorText: {
    color: '#1F2328',
    fontSize: getResponsiveSize(12),
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
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
    maxWidth: getDimensions().width * 0.85,
    maxHeight: getDimensions().height * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  padaPopupScrollView: {
    maxHeight: getDimensions().height * 0.6,
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
  directionIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: getResponsiveSize(-8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveSize(3),
  },
  upArrow: {
    fontSize: getResponsiveSize(24),
    fontWeight: '900',
    color: '#9c7603',
    textShadowColor: 'rgba(244, 196, 48, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  directionLabel: {
    fontSize: getResponsiveSize(14),
    fontWeight: '700',
    color: '#9c7603',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : (Platform.OS === 'ios' ? 'System' : "'DM Sans', sans-serif"),
    letterSpacing: 1,
  },
  rotationControlsPanel: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 110,
    left: '10%',
    right: '10%',
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getResponsiveSize(12),
    padding: getResponsiveSize(10),
    zIndex: 200,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rotationControlsContent: {
    gap: getResponsiveSize(8),
  },
  rotationControlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(4),
  },
  rotationControlsTitle: {
    fontSize: getResponsiveSize(14),
    fontWeight: '700',
    color: '#1F2328',
    flex: 1,
    textAlign: 'center',
  },
  rotationControlsCloseButton: {
    width: getResponsiveSize(24),
    height: getResponsiveSize(24),
    borderRadius: getResponsiveSize(12),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  rotationControlsCloseText: {
    fontSize: getResponsiveSize(16),
    color: '#6B7280',
    fontWeight: '600',
    lineHeight: getResponsiveSize(16),
  },
  rotationInputContainer: {
    gap: getResponsiveSize(4),
  },
  rotationInputLabel: {
    fontSize: getResponsiveSize(10),
    fontWeight: '600',
    color: '#6B7280',
  },
  rotationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(6),
  },
  rotationInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F4C430',
    borderRadius: getResponsiveSize(6),
    paddingVertical: getResponsiveSize(6),
    paddingHorizontal: getResponsiveSize(10),
    fontSize: getResponsiveSize(12),
    fontWeight: '600',
    color: '#1F2328',
    textAlign: 'center',
  },
  rotationApplyButton: {
    backgroundColor: '#F4C430',
    borderRadius: getResponsiveSize(6),
    paddingVertical: getResponsiveSize(6),
    paddingHorizontal: getResponsiveSize(12),
    elevation: 2,
  },
  rotationApplyButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(11),
    fontWeight: '700',
  },
  rotationSliderContainer: {
    gap: getResponsiveSize(6),
  },
  rotationSliderLabel: {
    fontSize: getResponsiveSize(10),
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  rotationSliderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(6),
  },
  rotationSliderMin: {
    fontSize: getResponsiveSize(9),
    fontWeight: '600',
    color: '#9CA3AF',
    width: getResponsiveSize(25),
  },
  rotationSliderTrack: {
    flex: 1,
    height: getResponsiveSize(6),
    backgroundColor: '#E5E7EB',
    borderRadius: getResponsiveSize(3),
    position: 'relative',
    overflow: 'visible',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }),
  },
  rotationSliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#F4C430',
    borderRadius: getResponsiveSize(3),
  },
  rotationSliderThumb: {
    position: 'absolute',
    top: getResponsiveSize(-5),
    width: getResponsiveSize(16),
    height: getResponsiveSize(16),
    borderRadius: getResponsiveSize(8),
    backgroundColor: '#F4C430',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginLeft: getResponsiveSize(-8),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  rotationSliderMax: {
    fontSize: getResponsiveSize(9),
    fontWeight: '600',
    color: '#9CA3AF',
    width: getResponsiveSize(25),
    textAlign: 'right',
  },
  rotationSliderButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: getResponsiveSize(6),
    marginTop: getResponsiveSize(2),
  },
  rotationSliderButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F4C430',
    borderRadius: getResponsiveSize(6),
    paddingVertical: getResponsiveSize(4),
    paddingHorizontal: getResponsiveSize(10),
    elevation: 2,
  },
  rotationSliderButtonText: {
    color: '#B8860B',
    fontSize: getResponsiveSize(10),
    fontWeight: '700',
  },
});

