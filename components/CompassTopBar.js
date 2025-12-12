import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SearchIcon from './icons/SearchIcon';
import CompassIcon from './icons/CompassIcon';
import LanguageToggle from './LanguageToggle';
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

export default function CompassTopBar({ onMenuPress, onSearchPress, onBackPress }) {
  const { t } = useI18n();

  return (
    <LinearGradient
      colors={['#F4C430', '#FFD700', '#F4C430']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackPress}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonCircle}>
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={onSearchPress}
          activeOpacity={0.8}
        >
          <View style={styles.searchContent}>
            <SearchIcon size={getResponsiveSize(18)} color="#666666" />
            <Text style={styles.searchText}>{t('header.search')}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.rightButtons}>
          <LanguageToggle />
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <View style={styles.hamburger}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
        </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? getResponsiveSize(42) : getResponsiveSize(32), // Increased from 38/28
    paddingBottom: getResponsiveSize(10), // Increased from 8 to 10
    paddingHorizontal: getResponsiveSize(12),
    elevation: 8,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8),
  },
  menuButton: {
    width: getResponsiveSize(44), // Increased from 40 to 44
    height: getResponsiveSize(44), // Increased from 40 to 44
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getResponsiveSize(8),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  hamburger: {
    width: getResponsiveSize(26), // Increased from 24 to 26
    height: getResponsiveSize(20), // Increased from 18 to 20
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 3, // Increased from 2.5 to 3
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  searchBar: {
    flex: 1,
    marginHorizontal: getResponsiveSize(10),
    borderRadius: getResponsiveSize(20),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getResponsiveSize(16), // Increased from 15 to 16
    paddingVertical: getResponsiveSize(10), // Increased from 8 to 10
    gap: getResponsiveSize(10), // Increased from 8 to 10
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchText: {
    fontSize: getResponsiveFont(14), // Increased from 13 to 14
    color: '#999999',
    flex: 1,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonCircle: {
    width: getResponsiveSize(40), // Increased from 36 to 40
    height: getResponsiveSize(40), // Increased from 36 to 40
    borderRadius: getResponsiveSize(20), // Increased from 18 to 20
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    fontSize: getResponsiveFont(28),
    color: '#FFFFFF',
    fontWeight: '900',
    textShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
    letterSpacing: -2,
    includeFontPadding: false,
    textAlign: 'center',
    lineHeight: getResponsiveFont(28),
  },
});
