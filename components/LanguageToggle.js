import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { useI18n } from '../utils/i18n';

const getResponsiveSize = (size) => {
  const { Dimensions } = require('react-native');
  try {
    const { width } = Dimensions.get('window');
    if (!width || width === 0) return size;
    if (Platform.OS === 'web') {
      const effectiveWidth = Math.min(width, 600);
      const scale = effectiveWidth / 375;
      return Math.max(size * scale, size * 0.8);
    }
    const scale = width / 375;
    return Math.max(size * scale, size * 0.8);
  } catch (error) {
    return size;
  }
};

const getResponsiveFont = (size) => {
  const { Dimensions } = require('react-native');
  try {
    const { width } = Dimensions.get('window');
    if (!width || width === 0) return size;
    if (Platform.OS === 'web') {
      const effectiveWidth = Math.min(width, 600);
      const scale = effectiveWidth / 375;
      return Math.max(size * scale, size * 0.85);
    }
    const scale = width / 375;
    return Math.max(size * scale, size * 0.85);
  } catch (error) {
    return size;
  }
};

export default function LanguageToggle() {
  const { language, changeLanguage } = useI18n();

  const handleLanguageChange = (lang) => {
    if (lang !== language) {
      changeLanguage(lang);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleWrapper}>
        <TouchableOpacity
          style={[styles.toggleButton, language === 'en' && styles.toggleButtonActive]}
          onPress={() => handleLanguageChange('en')}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, language === 'en' && styles.toggleTextActive]}>
            EN
          </Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity
          style={[styles.toggleButton, language === 'hi' && styles.toggleButtonActive]}
          onPress={() => handleLanguageChange('hi')}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, language === 'hi' && styles.toggleTextActive]}>
            हिं
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF', // Warm White
    borderRadius: getResponsiveSize(20),
    padding: getResponsiveSize(2),
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
    elevation: 2,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    }),
  },
  toggleButton: {
    paddingHorizontal: getResponsiveSize(10),
    paddingVertical: getResponsiveSize(6),
    borderRadius: getResponsiveSize(16),
    minWidth: getResponsiveSize(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 3px rgba(0, 0, 0, 0.25)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
    }),
  },
  toggleText: {
    fontSize: getResponsiveFont(11),
    color: '#6B7280', // Slate - grey for inactive
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  toggleTextActive: {
    color: '#F4B000', // Saffron Gold
    fontWeight: '800',
    textShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  divider: {
    width: 1,
    height: getResponsiveSize(20),
    backgroundColor: '#E9E2D6', // Sand Line
    marginHorizontal: getResponsiveSize(2),
    alignSelf: 'center',
  },
});

