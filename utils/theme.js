// Material Design 3 Theme
// Professional color palette with softer gold/yellow as primary

import { Platform } from 'react-native';

export const colors = {
  // Primary Color - Softer, professional gold
  primary: '#FFB300', // Material Amber 600 - softer than current gold
  primaryLight: '#FFC107', // Material Amber 500
  primaryDark: '#FF8F00', // Material Amber 700
  primaryContainer: '#FFF8E1', // Light amber background
  onPrimary: '#FFFFFF', // White text on primary
  
  // Secondary Color - For accents
  secondary: '#64B5F6', // Material Blue 300 - complementary to gold
  secondaryLight: '#90CAF9', // Material Blue 200
  secondaryDark: '#42A5F5', // Material Blue 400
  secondaryContainer: '#E3F2FD', // Light blue background
  onSecondary: '#FFFFFF',
  
  // Tertiary / Neutral Colors
  surface: '#FFFFFF', // White surface
  surfaceVariant: '#F5F5F5', // Light gray surface
  background: '#FAFAFA', // Off-white background
  
  // Neutral Variant - For borders, dividers, typography
  outline: '#E0E0E0', // Light gray border
  outlineVariant: '#F5F5F5', // Very light border
  shadow: 'rgba(0, 0, 0, 0.1)', // Subtle shadow
  
  // Text Colors
  onSurface: '#212121', // Dark gray text (Material Gray 900)
  onSurfaceVariant: '#616161', // Medium gray text (Material Gray 700)
  onBackground: '#212121',
  
  // Error/Success States
  error: '#D32F2F', // Material Red 700
  errorContainer: '#FFEBEE',
  onError: '#FFFFFF',
  
  success: '#388E3C', // Material Green 700
  successContainer: '#E8F5E9',
  onSuccess: '#FFFFFF',
  
  // Legacy support (will be phased out)
  legacy: {
    gold: '#FFB300', // Maps to primary
    darkGold: '#FF8F00', // Maps to primaryDark
    lightGold: '#FFF8E1', // Maps to primaryContainer
    brown: '#616161', // Maps to onSurfaceVariant
  }
};

// Material Design 3 Typography
export const typography = {
  // Display styles (large headings)
  displayLarge: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 57,
    fontWeight: '400',
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 45,
    fontWeight: '400',
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 44,
    letterSpacing: 0,
  },
  
  // Headline styles
  headlineLarge: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 32,
    letterSpacing: 0,
  },
  
  // Title styles
  titleLarge: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  
  // Body styles
  bodyLarge: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  
  // Label styles
  labelLarge: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  
  // Helper function to get font family
  getFontFamily: () => {
    return Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System';
  }
};

// Material Design 3 Elevation/Shadows
export const elevation = {
  level0: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  level1: {
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  level2: {
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
  },
  level3: {
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  level4: {
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 3.84,
  },
  level5: {
    elevation: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.26,
    shadowRadius: 5.46,
  },
};

// Material Design 3 Border Radius
export const borderRadius = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999,
};

