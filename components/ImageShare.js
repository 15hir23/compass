import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import DownloadIcon from './icons/DownloadIcon';
import ShareIcon from './icons/ShareIcon';

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
  
  // For web/large screens, cap the scaling
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
  
  // For web/large screens, cap the scaling
  if (Platform.OS === 'web') {
    const effectiveWidth = Math.min(width, 600);
    const scale = effectiveWidth / 375;
    return Math.max(size * scale, size * 0.85);
  }
  
  const scale = width / 375;
  return Math.max(size * scale, size * 0.85);
};

export default function ImageShare({ imageUri, compassViewRef, onClose }) {
  const [saving, setSaving] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync({
          writeOnly: true, // Only request write permission, not audio
        });
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant storage permission to save images.');
          return false;
        }
      } catch (error) {
        console.error('Permission error:', error);
        Alert.alert('Permission Error', 'Failed to request storage permission.');
        return false;
      }
    }
    return true;
  };


  const handleDownload = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'No image to download');
      return;
    }

    setSaving(true);
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setSaving(false);
        return;
      }

      // Create a filename with timestamp
      const timestamp = new Date().getTime();
      const filename = `vastu-compass-${timestamp}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Copy the image to app directory
      await FileSystem.copyAsync({
        from: imageUri,
        to: fileUri,
      });

      // Save to media library
      if (Platform.OS !== 'web') {
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('Vastu Compass', asset, false);
        Alert.alert('Success', 'Image saved to gallery!');
      } else {
        Alert.alert('Success', 'Image ready for download');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'No image to share');
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Vastu Compass Image',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share image. Please try again.');
    }
  };

  if (!imageUri) return null;

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleDownload}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F4C430', '#FFD700', '#F4C430']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
          >
            <View style={styles.buttonContent} pointerEvents="none">
              <DownloadIcon size={getResponsiveSize(18)} color="#FFFFFF" />
              <Text style={styles.buttonText}>
                {saving ? 'Saving...' : 'Download'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#DAA520', '#F4C430', '#DAA520']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
          >
            <View style={styles.buttonContent} pointerEvents="none">
              <ShareIcon size={getResponsiveSize(18)} color="#FFFFFF" />
              <Text style={styles.buttonText}>Share</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveSize(20),
    paddingVertical: getResponsiveSize(8),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveSize(12),
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: getResponsiveSize(20),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minWidth: 0, // Allow flex shrinking
    minHeight: getResponsiveSize(44),
  },
  buttonGradient: {
    paddingVertical: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(20),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveSize(44),
    width: '100%',
    height: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFont(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

