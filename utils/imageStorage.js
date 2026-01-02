import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@vastu_compass_images';
const MAX_IMAGES = 3;

// Get all stored images
export const getStoredImages = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error getting stored images:', error);
    return [];
  }
};

// Save a new image (keeps only last 3)
export const saveImage = async (imageUri, mode, heading) => {
  try {
    const existingImages = await getStoredImages();
    
    const newImage = {
      uri: imageUri,
      mode: mode,
      heading: heading,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    };
    
    // Add new image at the beginning
    const updatedImages = [newImage, ...existingImages];
    
    // Keep only the last 3 images
    const imagesToStore = updatedImages.slice(0, MAX_IMAGES);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(imagesToStore));
    } catch (storageError) {
      // If quota exceeded (common on web with data URLs), try with only 1 image
      if (storageError.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, storing only the latest image');
        const singleImage = [newImage];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(singleImage));
        return singleImage;
      }
      throw storageError;
    }
    
    return imagesToStore;
  } catch (error) {
    console.error('Error saving image:', error);
    // Return the current image even if storage failed, so it can still be displayed
    return [{
      uri: imageUri,
      mode: mode,
      heading: heading,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    }];
  }
};

// Delete a specific image
export const deleteImage = async (timestamp) => {
  try {
    const existingImages = await getStoredImages();
    const updatedImages = existingImages.filter(img => img.timestamp !== timestamp);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedImages));
    return updatedImages;
  } catch (error) {
    console.error('Error deleting image:', error);
    return [];
  }
};

// Clear all images
export const clearAllImages = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (error) {
    console.error('Error clearing images:', error);
    return [];
  }
};

// Format date for display
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  // Format as date
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  return `${month} ${day}, ${year} ${time}`;
};

