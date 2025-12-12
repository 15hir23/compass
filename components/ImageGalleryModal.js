import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { getStoredImages, deleteImage, formatDate } from '../utils/imageStorage';
import { useI18n } from '../utils/i18n';

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

export default function ImageGalleryModal({ visible, onClose, onSelectImage }) {
  const { t } = useI18n();
  const [images, setImages] = useState([]);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      loadImages();
      scale.value = withSpring(1, { damping: 20, stiffness: 150 });
    } else {
      scale.value = 0;
    }
  }, [visible]);

  const loadImages = async () => {
    const storedImages = await getStoredImages();
    setImages(storedImages);
  };

  const handleDelete = async (timestamp) => {
    const updatedImages = await deleteImage(timestamp);
    setImages(updatedImages);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: scale.value,
    };
  });

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.9)']}
          style={styles.backdrop}
        >
          <Animated.View style={[styles.content, animatedStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('gallery.title')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>

            {/* Image list */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {images.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{t('gallery.noImages')}</Text>
                </View>
              ) : (
                images.map((image, index) => (
                  <TouchableOpacity
                    key={image.timestamp}
                    style={styles.imageItem}
                    onPress={() => {
                      onSelectImage(image);
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: image.uri }} style={styles.thumbnail} />
                    <View style={styles.imageInfo}>
                      <Text style={styles.imageDate}>{formatDate(image.date)}</Text>
                      <Text style={styles.imageMode}>Mode: {image.mode}</Text>
                      <Text style={styles.imageHeading}>Heading: {Math.round(image.heading)}°</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(image.timestamp);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.deleteButtonText}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSize(20),
  },
  content: {
    width: '100%',
    maxWidth: getResponsiveSize(400),
    maxHeight: '80%',
    backgroundColor: '#FFF8E1',
    borderRadius: getResponsiveSize(16),
    borderWidth: 2,
    borderColor: '#F4C430',
    elevation: 20,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(20),
    paddingVertical: getResponsiveSize(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F4C430',
  },
  headerTitle: {
    fontSize: getResponsiveFont(20),
    fontWeight: '900',
    color: '#B8860B',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  closeButton: {
    width: getResponsiveSize(36),
    height: getResponsiveSize(36),
    borderRadius: getResponsiveSize(18),
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFont(20),
    fontWeight: '900',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: getResponsiveSize(16),
  },
  emptyState: {
    paddingVertical: getResponsiveSize(60),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: getResponsiveFont(15),
    color: '#8B7355',
    fontStyle: 'italic',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  imageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(14),
    padding: getResponsiveSize(14),
    marginBottom: getResponsiveSize(14),
    borderWidth: 2,
    borderColor: '#F4C430',
    elevation: 6,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  thumbnail: {
    width: getResponsiveSize(80),
    height: getResponsiveSize(80),
    borderRadius: getResponsiveSize(8),
    backgroundColor: '#F5F5F5',
  },
  imageInfo: {
    flex: 1,
    marginLeft: getResponsiveSize(12),
  },
  imageDate: {
    fontSize: getResponsiveFont(14),
    fontWeight: '900',
    color: '#B8860B',
    marginBottom: getResponsiveSize(5),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  imageMode: {
    fontSize: getResponsiveFont(12),
    color: '#666666',
    marginBottom: getResponsiveSize(3),
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  imageHeading: {
    fontSize: getResponsiveFont(12),
    color: '#666666',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  deleteButton: {
    width: getResponsiveSize(28),
    height: getResponsiveSize(28),
    borderRadius: getResponsiveSize(14),
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: getResponsiveSize(8),
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFont(16),
    fontWeight: '900',
  },
});

