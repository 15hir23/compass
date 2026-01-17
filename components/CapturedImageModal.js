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
  ScrollView,
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
import * as ImageManipulator from 'expo-image-manipulator';
import { captureRef } from 'react-native-view-shot';
import { Svg, Path, Line, Circle, Rect, Text as SvgText, Polygon, G } from 'react-native-svg';
import { CompassToggleIcon } from './svgs';
import CompassView from './CompassView';
import { GRID_STRUCTURE } from '../utils/gridStructure';
import { VASTU_GRID_9X9 } from '../utils/vastuGrid';
import { translateDevta } from '../utils/i18n';
import { useI18n } from '../utils/i18n';

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

export default function CapturedImageModal({ 
  visible, 
  imageUri, 
  mode, 
  heading, 
  onClose, 
  onClearImage,
  onImageSizeChange,
  compassType = 'vastu',
  initialGridState = false,
  onOpen
}) {
  const { language } = useI18n();
  const { width: screenWidth, height: screenHeight } = getDimensions();
  const [imageScale, setImageScale] = useState(1.0);
  const scale = useSharedValue(0);
  const imageContainerRef = useRef(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCropMode, setIsCropMode] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [cropRegion, setCropRegion] = useState(null);
  const [originalImageUri, setOriginalImageUri] = useState(null);
  const [editedImageUri, setEditedImageUri] = useState(null);
  
  // Crop corners for customizable crop area
  const [cropCorners, setCropCorners] = useState(() => {
    const marginX = screenWidth * 0.1;
    const marginY = screenHeight * 0.15;
    return [
      { x: marginX, y: marginY }, // Top-Left
      { x: screenWidth - marginX, y: marginY }, // Top-Right
      { x: screenWidth - marginX, y: screenHeight - marginY }, // Bottom-Right
      { x: marginX, y: screenHeight - marginY }, // Bottom-Left
    ];
  });
  
  // Drag state for crop corner markers
  const cropDragStateRef = useRef({
    activeIndex: null,
    startX: 0,
    startY: 0,
    cornerStartX: 0,
    cornerStartY: 0,
  });
  
  // Use edited image URI if available, otherwise use the prop
  const displayImageUri = editedImageUri || imageUri;
  
  // Grid & Compass Controls - Don't auto-show compass
  const [showCompass, setShowCompass] = useState(false);
  const [showVastuGrid, setShowVastuGrid] = useState(initialGridState);
  const [showOuterLayer, setShowOuterLayer] = useState(true);
  const [showMiddleLayer, setShowMiddleLayer] = useState(true);
  const [showCenterLayer, setShowCenterLayer] = useState(true);
  
  // Pada popup state
  const [selectedPada, setSelectedPada] = useState(null);
  
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

  // Update crop corners when screen dimensions change
  React.useEffect(() => {
    if (!isCropMode) {
      // Only reset if not currently in crop mode
      const marginX = screenWidth * 0.1;
      const marginY = screenHeight * 0.15;
      setCropCorners([
        { x: marginX, y: marginY },
        { x: screenWidth - marginX, y: marginY },
        { x: screenWidth - marginX, y: screenHeight - marginY },
        { x: marginX, y: screenHeight - marginY },
      ]);
    }
  }, [screenWidth, screenHeight, isCropMode]);

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

  // Rotate image - visual preview only, will be applied on save
  const handleRotate = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  // Enter crop mode - show draggable crop handles
  const handleCrop = () => {
    const imageToCrop = originalImageUri || displayImageUri;
    if (!imageToCrop) {
      Alert.alert('Error', 'No image to crop');
      return;
    }
    
    // Initialize crop corners to default position if not set
    if (!cropCorners || cropCorners.length === 0) {
      const marginX = screenWidth * 0.1;
      const marginY = screenHeight * 0.15;
      setCropCorners([
        { x: marginX, y: marginY },
        { x: screenWidth - marginX, y: marginY },
        { x: screenWidth - marginX, y: screenHeight - marginY },
        { x: marginX, y: screenHeight - marginY },
      ]);
    }
    
    // Enter crop mode
    setIsCropMode(true);
  };

  // Apply crop using the crop corners
  const handleApplyCrop = async () => {
    try {
      const imageToCrop = originalImageUri || displayImageUri;
      if (!imageToCrop) {
        Alert.alert('Error', 'No image to crop');
        return;
      }

      // Calculate crop region based on crop corners
      const minX = Math.min(cropCorners[0].x, cropCorners[1].x, cropCorners[2].x, cropCorners[3].x);
      const maxX = Math.max(cropCorners[0].x, cropCorners[1].x, cropCorners[2].x, cropCorners[3].x);
      const minY = Math.min(cropCorners[0].y, cropCorners[1].y, cropCorners[2].y, cropCorners[3].y);
      const maxY = Math.max(cropCorners[0].y, cropCorners[1].y, cropCorners[2].y, cropCorners[3].y);

      // Validate crop region size
      const cropScreenWidth = maxX - minX;
      const cropScreenHeight = maxY - minY;
      if (cropScreenWidth < 50 || cropScreenHeight < 50) {
        Alert.alert('Error', 'Crop region is too small. Please adjust the crop handles to create a larger area.');
        return;
      }

      // Get image dimensions
      const getImageSize = () => {
        return new Promise((resolve) => {
          Image.getSize(
            imageToCrop,
            (width, height) => {
              resolve({ width, height });
            },
            (error) => {
              console.warn('Image.getSize failed, using screen dimensions as fallback:', error);
              resolve({ width: screenWidth, height: screenHeight });
            }
          );
        });
      };

      const { width: imgWidth, height: imgHeight } = await getImageSize();

      // Convert screen coordinates to image coordinates
      const scaleX = imgWidth / screenWidth;
      const scaleY = imgHeight / screenHeight;
      
      const originX = Math.max(0, Math.round(minX * scaleX));
      const originY = Math.max(0, Math.round(minY * scaleY));
      const cropWidth = Math.min(imgWidth - originX, Math.round(cropScreenWidth * scaleX));
      const cropHeight = Math.min(imgHeight - originY, Math.round(cropScreenHeight * scaleY));

      // Validate crop region
      if (cropWidth <= 0 || cropHeight <= 0 || originX >= imgWidth || originY >= imgHeight) {
        Alert.alert('Error', 'Invalid crop region. Please adjust the crop handles.');
        return;
      }

      const cropConfig = {
        originX,
        originY,
        width: cropWidth,
        height: cropHeight,
      };

      // Apply crop
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageToCrop,
        [{ crop: cropConfig }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Store the cropped image URI
      setEditedImageUri(manipulatedImage.uri);
      setCropRegion(cropConfig);
      
      // Exit crop mode
      setIsCropMode(false);

      Alert.alert('Success', 'Image cropped successfully!');
    } catch (error) {
      console.error('Error applying crop:', error);
      Alert.alert('Error', 'Failed to crop image: ' + (error.message || 'Unknown error'));
    }
  };

  // Cancel crop mode
  const handleCancelCrop = () => {
    setIsCropMode(false);
  };

  // Save edited image (apply rotation and crop)
  const handleSaveEdit = async () => {
    try {
      if (!originalImageUri && !imageUri) {
        Alert.alert('Error', 'No image to save');
        return;
      }

      // Start with the image that has crop applied (if any), otherwise use original
      let processedUri = editedImageUri || originalImageUri || imageUri;

      // Apply rotation to the current processed image (which may already be cropped)
      if (imageRotation !== 0) {
        const rotatedImage = await ImageManipulator.manipulateAsync(
          processedUri,
          [{ rotate: imageRotation }],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );
        processedUri = rotatedImage.uri;
      }

      // Update the edited image URI
      setEditedImageUri(processedUri);

      // Update parent component if callback exists
      if (onImageSizeChange) {
        onImageSizeChange(processedUri);
      }

      // Exit edit mode and reset edit state
      setIsEditMode(false);
      setImageRotation(0);
      setCropRegion(null);
      setOriginalImageUri(null);

      Alert.alert('Success', 'Image edited and saved successfully!');
    } catch (error) {
      console.error('Error saving edited image:', error);
      Alert.alert('Error', 'Failed to save edited image: ' + (error.message || 'Unknown error'));
    }
  };

  // Pada descriptions (same as MapViewModal and CameraCapture)
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

  // Bilinear interpolation helper function (like web map)
  // gridCorners: [topLeft, topRight, bottomRight, bottomLeft]
  // rowT: 0 = top, 1 = bottom
  // colT: 0 = left, 1 = right
  const getGridPoint = (rowT, colT) => {
    if (gridCorners.length !== 4) return { x: 0, y: 0 };
    
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

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 25, stiffness: 190 });
      // Set grid state if initialGridState is true
      if (initialGridState) {
        setShowVastuGrid(true);
        // Call onOpen callback after component is mounted
        if (onOpen) {
          setTimeout(() => {
            onOpen();
          }, 100);
        }
      }
      // Reset edit mode when modal opens
      setIsEditMode(false);
      setIsCropMode(false);
      setImageRotation(0);
      setCropRegion(null);
      setOriginalImageUri(null);
      // Keep editedImageUri when modal is visible (allows viewing edited image)
    } else {
      scale.value = 0;
      // Reset edit state when modal closes
      setIsEditMode(false);
      setIsCropMode(false);
      setImageRotation(0);
      setCropRegion(null);
      setOriginalImageUri(null);
      setEditedImageUri(null);
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
            {/* Top Bar with Back button, Direction Indicator, and Edit button */}
            <View style={styles.topBar}>
              {/* Left side: Back button */}
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

              {/* Center: Direction Indicator */}
              {heading !== undefined && heading !== null && (
                <View style={styles.directionIndicator}>
                  {/* Up Arrow */}
                  <Text style={styles.upArrow}>↑</Text>
                  {/* Current Direction Label - Right of arrow */}
                  <Text style={styles.directionLabel}>{getCardinalDirection(heading)}</Text>
                </View>
              )}

              {/* Right side: Edit button */}
              {!isEditMode ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    // Store current display image (could be edited or original) as the base for editing
                    setOriginalImageUri(displayImageUri);
                    setIsEditMode(true);
                    // Reset rotation and crop when entering edit mode
                    setImageRotation(0);
                    setCropRegion(null);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#F4C430', '#FFD700']}
                    style={styles.editButtonGradient}
                  >
                    <Svg width={getResponsiveSize(20)} height={getResponsiveSize(20)} viewBox="0 0 494.936 494.936">
                      <Path
                        d="M389.844,182.85c-6.743,0-12.21,5.467-12.21,12.21v222.968c0,23.562-19.174,42.735-42.736,42.735H67.157
                          c-23.562,0-42.736-19.174-42.736-42.735V150.285c0-23.562,19.174-42.735,42.736-42.735h267.741c6.743,0,12.21-5.467,12.21-12.21
                          s-5.467-12.21-12.21-12.21H67.157C30.126,83.13,0,113.255,0,150.285v267.743c0,37.029,30.126,67.155,67.157,67.155h267.741
                          c37.03,0,67.156-30.126,67.156-67.155V195.061C402.054,188.318,396.587,182.85,389.844,182.85z"
                        fill="#FFFFFF"
                      />
                      <Path
                        d="M483.876,20.791c-14.72-14.72-38.669-14.714-53.377,0L221.352,229.944c-0.28,0.28-3.434,3.559-4.251,5.396l-28.963,65.069
                          c-2.057,4.619-1.056,10.027,2.521,13.6c2.337,2.336,5.461,3.576,8.639,3.576c1.675,0,3.362-0.346,4.96-1.057l65.07-28.963
                          c1.83-0.815,5.114-3.97,5.396-4.25L483.876,74.169c7.131-7.131,11.06-16.61,11.06-26.692
                          C494.936,37.396,491.007,27.915,483.876,20.791z M466.61,56.897L257.457,266.05c-0.035,0.036-0.055,0.078-0.089,0.107
                          l-33.989,15.131L238.51,247.3c0.03-0.036,0.071-0.055,0.107-0.09L447.765,38.058c5.038-5.039,13.819-5.033,18.846,0.005
                          c2.518,2.51,3.905,5.855,3.905,9.414C470.516,51.036,469.127,54.38,466.61,56.897z"
                        fill="#FFFFFF"
                      />
                    </Svg>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.editButtonPlaceholder} />
              )}
            </View>

            {/* Image with compass and grid overlay - Full screen */}
            <View 
              ref={imageContainerRef}
              style={[styles.imageContainer, StyleSheet.absoluteFill]}
            >
              <Image 
                source={{ uri: displayImageUri }} 
                style={[
                  StyleSheet.absoluteFill,
                  // Show rotation preview in edit mode
                  isEditMode && imageRotation !== 0 && {
                    transform: [{ rotate: `${imageRotation}deg` }],
                  },
                ]}
                resizeMode="cover"
              />
              
              {/* Resizable Capture Frame Overlay - Full screen (hide in crop mode) */}
              {!isCropMode && (
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
                      
                      {/* Render all cells from GRID_STRUCTURE (matching map view) */}
                      {GRID_STRUCTURE.map((cell) => {
                        // Determine layer
                        const isOuter = cell.row === 0 || cell.row === 8 || cell.col === 0 || cell.col === 8;
                        const isCenter = cell.name === 'Brahma';
                        const isMiddle = !isOuter && !isCenter;
                        
                        // Skip if layer is hidden
                        if (isOuter && !showOuterLayer) return null;
                        if (isMiddle && !showMiddleLayer) return null;
                        if (isCenter && !showCenterLayer) return null;
                        
                        // Get cell corners using getGridPoint
                        const tl = getGridPoint(cell.row / 9, cell.col / 9);
                        const tr = getGridPoint(cell.row / 9, (cell.col + cell.colSpan) / 9);
                        const br = getGridPoint((cell.row + cell.rowSpan) / 9, (cell.col + cell.colSpan) / 9);
                        const bl = getGridPoint((cell.row + cell.rowSpan) / 9, cell.col / 9);
                        
                        // Get devta info for coloring (matching map view)
                        const devtaInfo = VASTU_GRID_9X9[cell.row]?.[cell.col] || { 
                          devta: cell.name, 
                          zone: '', 
                          energy: 'neutral', 
                          color: '#87CEEB' 
                        };
                        
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
                        const spanFactor = cell.rowSpan + cell.colSpan;
                        if (cell.name === 'Brahma') {
                          strokeWidth = 4;
                        } else if (spanFactor > 3) {
                          strokeWidth = 3;
                        }
                        const strokeOpacity = 0.8; // Same as map view
                        
                        return (
                          <Polygon
                            key={`cell-${cell.row}-${cell.col}-${cell.name}`}
                            points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`}
                            fill={fillColor}
                            fillOpacity={fillOpacity}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeOpacity={strokeOpacity}
                          />
                        );
                      })}
                      
                      {/* Highlight Brahmasthan with premium golden color (matching map view) */}
                      {showCenterLayer && (() => {
                        const brahmasthanCells = [];
                        // Center 3x3 cells (rows 3-5, cols 3-5)
                        for (let row = 3; row < 6; row++) {
                          for (let col = 3; col < 6; col++) {
                            const tl = getGridPoint(row / 9, col / 9);
                            const tr = getGridPoint(row / 9, (col + 1) / 9);
                            const br = getGridPoint((row + 1) / 9, (col + 1) / 9);
                            const bl = getGridPoint((row + 1) / 9, col / 9);
                            brahmasthanCells.push(
                              <Polygon
                                key={`brahma-${row}-${col}`}
                                points={`${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`}
                                fill="#FFE87C"
                                fillOpacity={0.4}
                                stroke="#FFC125"
                                strokeWidth={3}
                                strokeOpacity={0.9}
                              />
                            );
                          }
                        }
                        
                        // OM Symbol at exact center
                        const center = getGridPoint(0.5, 0.5);
                        return (
                          <>
                            {brahmasthanCells}
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
                      
                      {/* Pada Name Labels from GRID_STRUCTURE */}
                      {GRID_STRUCTURE.map((cell) => {
                        // Determine layer
                        const isOuter = cell.row === 0 || cell.row === 8 || cell.col === 0 || cell.col === 8;
                        const isCenter = cell.name === 'Brahma';
                        const isMiddle = !isOuter && !isCenter;
                        
                        // Skip if layer is hidden
                        if (isOuter && !showOuterLayer) return null;
                        if (isMiddle && !showMiddleLayer) return null;
                        if (isCenter && !showCenterLayer) return null;
                        
                        // Get cell center using getGridPoint (rowT, colT are 0-1)
                        const centerRowT = (cell.row + cell.rowSpan / 2) / 9;
                        const centerColT = (cell.col + cell.colSpan / 2) / 9;
                        const center = getGridPoint(centerRowT, centerColT);
                        
                        // Get devta info
                        const devtaInfo = VASTU_GRID_9X9[cell.row]?.[cell.col] || { 
                          devta: cell.name, 
                          zone: '', 
                          energy: 'neutral', 
                          color: '#87CEEB' 
                        };
                        
                        const translatedName = translateDevta(cell.name, language || 'en');
                        
                        // Hierarchical font sizing (matching map view)
                        let fontSize = 9;
                        let fontWeight = 'bold';
                        let padding = 3;
                        let borderRadius = 4;
                        let letterSpacing = 0.5;
                        
                        const spanFactor = cell.rowSpan + cell.colSpan;
                        
                        if (cell.name === 'Brahma') {
                          fontSize = 18;
                          fontWeight = '900';
                          padding = 6;
                          borderRadius = 8;
                          letterSpacing = 2;
                        } else if (cell.name === 'Prithvidhara' || cell.name === 'Vivaswan') {
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
                        } else if (spanFactor === 3) {
                          fontSize = 11;
                          fontWeight = '700';
                          padding = 3;
                          letterSpacing = 0.6;
                        } else if (cell.name === 'Pushpadanta' || cell.name === 'Gandharva') {
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
                        const cellLeft = getGridPoint(cell.row / 9, cell.col / 9);
                        const cellRight = getGridPoint(cell.row / 9, (cell.col + cell.colSpan) / 9);
                        const cellWidth = Math.abs(cellRight.x - cellLeft.x);
                        const minGap = fontSize * 0.4; // Minimal gap (40% of font size) to prevent collisions
                        const maxBoxWidth = cellWidth - (minGap * 2); // Leave gap on both sides
                        const finalBoxWidth = Math.min(boxWidth, maxBoxWidth);
                        
                        // Skip Brahma label (OM symbol is already shown)
                        if (cell.name === 'Brahma') return null;
                        
                        return (
                          <G key={`pada-label-${cell.row}-${cell.col}-${cell.name}`}>
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
                        );
                      })}
                    </>
                  );
                })()}
                
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
                <G transform={`translate(20, ${screenHeight / 2}) rotate(90)`}>
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
                <G transform={`translate(${screenWidth - 20}, ${screenHeight / 2}) rotate(-90)`}>
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
                  x={screenWidth / 2}
                  y={screenHeight - 30}
                  fontSize={12}
                  fontFamily="'DM Sans', sans-serif"
                  fill="rgba(255, 255, 255, 0.7)"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  NiraLiveAstro.com
                </SvgText>
              </Svg>
              )}
              
              {/* Clickable overlays for pada cells (hide in crop mode) */}
              {!isCropMode && showVastuGrid && GRID_STRUCTURE.map((cell) => {
                // Determine layer
                const isOuter = cell.row === 0 || cell.row === 8 || cell.col === 0 || cell.col === 8;
                const isCenter = cell.name === 'Brahma';
                const isMiddle = !isOuter && !isCenter;
                
                // Skip if layer is hidden
                if (isOuter && !showOuterLayer) return null;
                if (isMiddle && !showMiddleLayer) return null;
                if (isCenter && !showCenterLayer) return null;
                
                // Get cell corners using getGridPoint
                const tl = getGridPoint(cell.row / 9, cell.col / 9);
                const tr = getGridPoint(cell.row / 9, (cell.col + cell.colSpan) / 9);
                const br = getGridPoint((cell.row + cell.rowSpan) / 9, (cell.col + cell.colSpan) / 9);
                const bl = getGridPoint((cell.row + cell.rowSpan) / 9, cell.col / 9);
                
                // Calculate bounding box for touch area
                const minX = Math.min(tl.x, tr.x, br.x, bl.x);
                const maxX = Math.max(tl.x, tr.x, br.x, bl.x);
                const minY = Math.min(tl.y, tr.y, br.y, bl.y);
                const maxY = Math.max(tl.y, tr.y, br.y, bl.y);
                
                const devtaInfo = VASTU_GRID_9X9[cell.row]?.[cell.col] || { 
                  devta: cell.name, 
                  zone: '', 
                  energy: 'neutral', 
                  color: '#87CEEB' 
                };
                const translatedName = translateDevta(cell.name, language || 'en');
                
                return (
                  <TouchableOpacity
                    key={`pada-touch-${cell.row}-${cell.col}-${cell.name}`}
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
              
              {/* Draggable corner markers - Hide in crop mode */}
              {!isCropMode && gridCorners.map((corner, i) => {
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

              {/* Crop Overlay - Show when in crop mode */}
              {isCropMode && (
                <>
                  {/* Dark overlay covering the screen */}
                  <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Svg style={StyleSheet.absoluteFill} width={screenWidth} height={screenHeight}>
                      {/* Full screen dark overlay */}
                      <Rect
                        x="0"
                        y="0"
                        width={screenWidth}
                        height={screenHeight}
                        fill="rgba(0, 0, 0, 0.7)"
                      />
                      {/* Crop border - bright green for visibility */}
                      <Polygon
                        points={`${cropCorners[0].x},${cropCorners[0].y} ${cropCorners[1].x},${cropCorners[1].y} ${cropCorners[2].x},${cropCorners[2].y} ${cropCorners[3].x},${cropCorners[3].y}`}
                        fill="none"
                        stroke="#00FF00"
                        strokeWidth="4"
                      />
                      {/* Corner guides - dashed lines */}
                      {cropCorners.map((corner, i) => {
                        const prevCorner = cropCorners[(i + 3) % 4];
                        const nextCorner = cropCorners[(i + 1) % 4];
                        return (
                          <React.Fragment key={`guide-${i}`}>
                            <Line
                              x1={corner.x}
                              y1={corner.y}
                              x2={prevCorner.x}
                              y2={prevCorner.y}
                              stroke="#00FF00"
                              strokeWidth="2"
                              strokeDasharray="5,5"
                              opacity="0.6"
                            />
                            <Line
                              x1={corner.x}
                              y1={corner.y}
                              x2={nextCorner.x}
                              y2={nextCorner.y}
                              stroke="#00FF00"
                              strokeWidth="2"
                              strokeDasharray="5,5"
                              opacity="0.6"
                            />
                          </React.Fragment>
                        );
                      })}
                    </Svg>
            </View>
            
                  {/* Draggable crop corner handles */}
                  {cropCorners.map((corner, i) => {
                    const handleResponderGrant = (event) => {
                      const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;
                      const pageX = touch.pageX || touch.locationX || 0;
                      const pageY = touch.pageY || touch.locationY || 0;
                      
                      cropDragStateRef.current = {
                        activeIndex: i,
                        startX: pageX,
                        startY: pageY,
                        cornerStartX: corner.x,
                        cornerStartY: corner.y,
                      };
                    };
                    
                    const handleResponderMove = (event) => {
                      if (cropDragStateRef.current.activeIndex !== i) return;
                      const touch = event.nativeEvent.touches?.[0] || event.nativeEvent;
                      const pageX = touch.pageX || touch.locationX || 0;
                      const pageY = touch.pageY || touch.locationY || 0;
                      
                      const deltaX = pageX - cropDragStateRef.current.startX;
                      const deltaY = pageY - cropDragStateRef.current.startY;
                      
                      const newCorners = [...cropCorners];
                      newCorners[i] = {
                        x: Math.max(0, Math.min(screenWidth, cropDragStateRef.current.cornerStartX + deltaX)),
                        y: Math.max(0, Math.min(screenHeight, cropDragStateRef.current.cornerStartY + deltaY)),
                      };
                      setCropCorners(newCorners);
                    };
                    
                    const handleResponderRelease = () => {
                      cropDragStateRef.current.activeIndex = null;
                    };
                    
                    return (
                      <View
                        key={`crop-corner-${i}`}
                        style={[
                          styles.cropCornerHandle,
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
                        <View style={styles.cropCornerDot} />
                      </View>
                    );
                  })}
                </>
              )}
            </View>
            
            {/* Action buttons - Crop mode shows Apply/Cancel, Edit mode shows Crop/Rotate/Save, normal mode shows all buttons */}
            <View style={styles.actionButtons}>
              {isCropMode ? (
                <>
                  {/* Cancel Crop button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCancelCrop}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionButtonContent}>
                      <Text style={styles.actionButtonText}>Cancel</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Apply Crop button */}
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleApplyCrop}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#00FF00', '#00CC00']}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>Apply Crop</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : isEditMode ? (
                <>
                  {/* Crop button - only in edit mode */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCrop}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionButtonContent}>
                      <Svg width={getResponsiveSize(16)} height={getResponsiveSize(16)} viewBox="0 0 24 24" fill="none">
                        {/* Crop icon - up arrow pointing to rectangle */}
                        <Path
                          d="M12 3L12 10M9 7L12 3L15 7"
                          stroke="#B8860B"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Rect
                          x="6"
                          y="14"
                          width="12"
                          height="8"
                          rx="1"
                          stroke="#B8860B"
                          strokeWidth="2"
                          fill="none"
                        />
                      </Svg>
                      <Text style={styles.actionButtonText}>Crop</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Rotate button - only in edit mode */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleRotate}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionButtonContent}>
                      <Text style={styles.actionButtonText}>↻ Rotate</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Save button - only in edit mode */}
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveEdit}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F4C430', '#FFD700']}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
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
                <>
                  {/* Outer Layer Toggle */}
                  <TouchableOpacity
                    style={[styles.actionButton, showOuterLayer && styles.actionButtonActive]}
                    onPress={() => setShowOuterLayer(!showOuterLayer)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionButtonContent}>
                      <Text style={styles.actionButtonText}>O</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Middle Layer Toggle */}
                  <TouchableOpacity
                    style={[styles.actionButton, showMiddleLayer && styles.actionButtonActive]}
                    onPress={() => setShowMiddleLayer(!showMiddleLayer)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionButtonContent}>
                      <Text style={styles.actionButtonText}>M</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Center Layer Toggle */}
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
                </>
              )}
            </View>
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
  editButton: {
    zIndex: 100,
  },
  editButtonGradient: {
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(10),
    borderRadius: getResponsiveSize(20),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(14),
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
  cropCornerHandle: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
    elevation: 10001,
  },
  cropCornerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00FF00',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 6,
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
    gap: getResponsiveSize(2),
  },
  editButtonPlaceholder: {
    width: getResponsiveSize(50),
    height: getResponsiveSize(50),
  },
  upArrow: {
    fontSize: getResponsiveSize(24),
    fontWeight: '900',
    color: '#9c7603',
    ...(Platform.OS === 'web' ? {
      textShadow: '0 1px 2px rgba(244, 196, 48, 0.5)',
    } : {
      textShadowColor: 'rgba(244, 196, 48, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    }),
  },
  directionLabel: {
    fontSize: getResponsiveSize(14),
    fontWeight: '700',
    color: '#9c7603',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    letterSpacing: 1,
  },
});

