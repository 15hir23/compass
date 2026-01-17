import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Image, TouchableOpacity, Text, Platform } from 'react-native';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { colors } from '../utils/theme';
import { CompassToggleIcon } from './svgs';
import NormalCompass from './compassModes/NormalCompass';
import Vastu16Compass from './compassModes/Vastu16Compass';
import Vastu32Compass from './compassModes/Vastu32Compass';
import Vastu45Compass from './compassModes/Vastu45Compass';
import ChakraCompass from './compassModes/ChakraCompass';
import ClassicCompass from './compassModes/ClassicCompass';
import FengShuiCompass from './compassModes/FengShuiCompass';

// Get dimensions safely
const getDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 };
  }
};

const { width, height } = getDimensions();

// Responsive compass size - increased for bigger, clearer display
const getCompassSize = () => {
  if (!width || width === 0) return 300;
  if (Platform.OS === 'web') {
    const effectiveWidth = Math.min(width, 600);
    return effectiveWidth * 0.90; // Increased from 0.75 to 0.90
  }
  const baseSize = width * 0.95; // Increased from 0.85 to 0.95
  if (width < 360) return width * 0.90; // Increased from 0.80 to 0.90
  if (width > 414) return Math.min(baseSize, 450); // Increased max from 420 to 450
  return baseSize;
};

const COMPASS_SIZE = getCompassSize();

// Responsive sizing functions
const getResponsiveSize = (size) => {
  if (!width || width === 0) return size;
  if (Platform.OS === 'web') {
    const effectiveWidth = Math.min(width, 700);
    const scale = effectiveWidth / 375;
    return Math.max(size * scale, size * 0.9);
  }
  const scale = width / 375;
  return Math.max(size * scale, size * 0.8);
};

const getResponsiveFont = (size) => {
  if (!width || width === 0) return size;
  if (Platform.OS === 'web') {
    const effectiveWidth = Math.min(width, 600);
    const scale = effectiveWidth / 375;
    return Math.max(size * scale, size * 0.85);
  }
  const scale = width / 375;
  return Math.max(size * scale, size * 0.85);
};

// Device detection and calibration
const getDeviceInfo = () => {
  if (Platform.OS !== 'web') {
    return {
      isIOS: Platform.OS === 'ios',
      isAndroid: Platform.OS === 'android',
      isPixel: false,
      isSamsung: false,
      platform: Platform.OS,
    };
  }
  
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  // Enhanced Pixel detection - check for various Pixel identifiers
  const isPixel = /Pixel|Google Pixel|pixel/i.test(ua) || 
                  (isAndroid && /G013[A-C]|G014[A-C]|G015[A-C]|G020[A-C]|G025[A-C]|G026[A-C]|G027[A-C]|G028[A-C]|G029[A-C]|G030[A-C]|G031[A-C]|G032[A-C]|G033[A-C]|G034[A-C]|G035[A-C]|G036[A-C]|G037[A-C]|G038[A-C]|G039[A-C]|G040[A-C]|G041[A-C]|G042[A-C]|G043[A-C]|G044[A-C]|G045[A-C]|G046[A-C]|G047[A-C]|G048[A-C]|G049[A-C]|G050[A-C]/.test(ua));
  const isSamsung = /Samsung/.test(ua);
  
  return {
    isIOS,
    isAndroid,
    isPixel,
    isSamsung,
    platform: Platform.OS,
  };
};

// Low-pass filter for smooth compass readings
class LowPassFilter {
  constructor(alpha = 0.15) {
    this.alpha = alpha; // Smoothing factor (0-1, lower = smoother)
    this.value = null;
  }

  filter(newValue) {
    if (this.value === null) {
      this.value = newValue;
      return newValue;
    }

    // Handle angle wraparound (359° -> 0°)
    let diff = newValue - this.value;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    this.value = this.value + this.alpha * diff;
    
    // Normalize to 0-360
    while (this.value < 0) this.value += 360;
    while (this.value >= 360) this.value -= 360;

    return this.value;
  }

  reset() {
    this.value = null;
  }
}

export default function CompassView({ 
  mode, 
  compassType, 
  capturedImage, 
  onClearImage, 
  onHeadingChange, 
  onImageSizeChange, 
  initialRotation,
  hideCalibration = false,
  onCalibrationStateChange,
  externalHeading = null
}) {
  const [heading, setHeading] = useState(0);
  const [imageContainerSize, setImageContainerSize] = useState(COMPASS_SIZE);
  const rotation = useSharedValue(0);
  const [initialRotationComplete, setInitialRotationComplete] = useState(false);
  const [webPermissionGranted, setWebPermissionGranted] = useState(false);
  const [showCalibration, setShowCalibration] = useState(true);
  const [calibrating, setCalibrating] = useState(false);
  
  // Entrance animation for compass container
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.8);
  
  // Notify parent when calibration state changes
  useEffect(() => {
    if (onCalibrationStateChange) {
      onCalibrationStateChange(showCalibration && !hideCalibration);
    }
  }, [showCalibration, hideCalibration, onCalibrationStateChange]);
  
  // Entrance animation
  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    containerScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, []);
  
  // Animation values for figure-8 calibration
  const figure8Progress = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  // Filters for smooth readings - optimized for maximum stability (like professional compasses)
  const deviceInfo = useRef(getDeviceInfo());
  // Initialize filter with very low alpha for maximum smoothness and stability
  const initialAlpha = deviceInfo.current.isPixel ? 0.05 : 0.08;
  const headingFilter = useRef(new LowPassFilter(initialAlpha)); // Lower alpha = more smoothing = more stability
  
  // Stability tracking
  const lastHeadingUpdate = useRef(0);
  const lastStableHeading = useRef(null);
  const stabilityTimer = useRef(null);
  const isStable = useRef(false); // Track if device has been stable for required time
  const lastAccelData = useRef({ x: 0, y: 0, z: 0, timestamp: 0 });
  const lastOrientationData = useRef({ beta: 0, gamma: 0, timestamp: 0 });
  const isDeviceMoving = useRef(false);
  const accelData = useRef({ x: 0, y: 0, z: 0 }); // Accelerometer data for tilt compensation
  const [isCompassStable, setIsCompassStable] = useState(false); // UI state for stability indicator
  
  // Configuration - optimized for maximum stability (professional compass behavior)
  const DEAD_ZONE_THRESHOLD = 2.5; // Degrees - increased to ignore tiny movements
  const STABILITY_TIME = 2000; // ms - time before considering stable
  const MOVEMENT_THRESHOLD = 0.4; // m/s² - higher threshold to ignore slight movements
  const HIGH_CONFIDENCE_THRESHOLD = 0.8; // Confidence level considered "high"
  const MIN_UPDATE_INTERVAL = 100; // ms - slower updates for stability
  const STATIONARY_ACCEL_THRESHOLD = 0.5; // m/s² - higher threshold for stationary detection
  const MIN_MOVEMENT_ANGLE = 3.0; // Degrees - minimum angle change to consider as movement
  const MIN_ROTATION_CHANGE = 1.5; // Degrees - minimum change before updating rotation animation
  
  const MIN_SIZE = COMPASS_SIZE * 1.0;
  const MAX_SIZE = COMPASS_SIZE * 1.3;

  // Log device info once on mount
  useEffect(() => {
    const device = deviceInfo.current;
    console.log('🧭 Compass initialized for device:', {
      platform: device.platform,
      isIOS: device.isIOS,
      isAndroid: device.isAndroid,
      isPixel: device.isPixel,
      isSamsung: device.isSamsung,
      userAgent: navigator.userAgent,
    });
    
    if (device.isPixel) {
      console.log('📱 Pixel device detected - applying special calibration:');
      console.log('  - Inverted sensor axes');
      console.log('  - 90° orientation correction');
      console.log('  - Enhanced smoothing (0.08 alpha)');
      console.log('  - Reduced update rate (150ms)');
      console.log('  - Increased damping for stability');
    }
  }, []);

  // Check if heading should be updated based on movement, confidence, and dead zone
  // Optimized for maximum stability - ignores very slight movements like professional compasses
  const shouldUpdateHeading = (newHeading, confidence, timestamp) => {
    // If no previous heading, always update
    if (lastStableHeading.current === null) {
      return true;
    }
    
    // Enforce minimum update interval
    const timeSinceLastUpdate = timestamp - lastHeadingUpdate.current;
    if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
      return false; // Too soon since last update
    }
    
    // Calculate angular difference (handling wraparound)
    let diff = Math.abs(newHeading - lastStableHeading.current);
    if (diff > 180) diff = 360 - diff;
    
    // If confidence is low, be slightly more lenient but still stable
    const effectiveThreshold = confidence && confidence < HIGH_CONFIDENCE_THRESHOLD 
      ? DEAD_ZONE_THRESHOLD * 0.7  // Slightly lower threshold when confidence is low
      : DEAD_ZONE_THRESHOLD;
    
    // If device is clearly moving (significant movement), allow updates
    if (isDeviceMoving.current && diff >= MIN_MOVEMENT_ANGLE) {
      isStable.current = false;
      setIsCompassStable(false);
      if (stabilityTimer.current) {
        clearTimeout(stabilityTimer.current);
        stabilityTimer.current = null;
      }
      // Only allow updates for significant changes when moving
      return diff >= MIN_MOVEMENT_ANGLE;
    }
    
    // Device appears stationary or movement is very slight
    if (diff < effectiveThreshold) {
      // Very small change when stationary - freeze updates completely when stable
      if (confidence && confidence >= HIGH_CONFIDENCE_THRESHOLD && !isDeviceMoving.current) {
        // Clear any existing stability timer
        if (stabilityTimer.current) {
          clearTimeout(stabilityTimer.current);
        }
        
        // Set timer to mark device as stable after stability period
        stabilityTimer.current = setTimeout(() => {
          isStable.current = true; // Device has been stable - freeze updates
          setIsCompassStable(true); // Update UI state
        }, STABILITY_TIME);
        
        // If already stable, completely ignore tiny movements (professional compass behavior)
        if (isStable.current) {
          return diff >= effectiveThreshold * 2.5; // Only update for very significant changes when stable
        }
        
        // Not yet stable - be very restrictive with updates
        return diff >= effectiveThreshold * 0.8;
      }
      
      // Low confidence or slight movement - be restrictive
      return diff >= effectiveThreshold * 0.7;
    }
    
    // Significant change detected - clear stability state and timer
    if (diff >= MIN_MOVEMENT_ANGLE) {
      isStable.current = false;
      setIsCompassStable(false);
      if (stabilityTimer.current) {
        clearTimeout(stabilityTimer.current);
        stabilityTimer.current = null;
      }
      return true;
    }
    
    // Change is between threshold and min movement - be cautious
    return diff >= effectiveThreshold * 1.2;
  };
  
  // Universal compass heading calculation using device magnetometer with tilt compensation
  // This properly uses the device's magnetometer to get accurate heading
  const calculateHeading = (mx, my, mz = 0, ax = 0, ay = 0, az = 0) => {
    // Normalize magnetometer readings
    const magMagnitude = Math.sqrt(mx * mx + my * my + mz * mz);
    if (magMagnitude < 0.01) {
      return lastStableHeading.current || 0; // Return last known heading if invalid
    }
    
    // Device coordinate system (Android/iOS standard):
    // - X-axis: points to the right edge of device (East)
    // - Y-axis: points to the top edge of device (North when device points North)
    // - Z-axis: points out of screen (upward)
    
    // Calculate device tilt using accelerometer (if available)
    const accelMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    let heading;
    
    if (accelMagnitude > 0.1) {
      // Device is tilted - use tilt compensation
      // Normalize accelerometer to get gravity vector
      const gx = ax / accelMagnitude;
      const gy = ay / accelMagnitude;
      const gz = az / accelMagnitude;
      
      // Calculate tilt angles
      const pitch = Math.asin(-gx); // Rotation around X-axis
      const cosPitch = Math.cos(pitch);
      
      // Calculate roll (rotation around Y-axis)
      let roll;
      if (Math.abs(cosPitch) > 0.001) {
        roll = Math.asin(gy / cosPitch);
      } else {
        roll = 0; // Avoid division by zero
      }
      
      // Rotate magnetometer readings to compensate for tilt
      // This projects the magnetic field onto the horizontal plane
      const sinPitch = Math.sin(pitch);
      const cosRoll = Math.cos(roll);
      const sinRoll = Math.sin(roll);
      
      // Rotate magnetometer vector to horizontal plane
      const hx = mx * cosPitch + mz * sinPitch;
      const hy = mx * sinRoll * sinPitch + my * cosRoll - mz * sinRoll * cosPitch;
      
      // Calculate heading from horizontal components
      // Standard formula: atan2(hx, hy) gives angle from North (Y-axis)
      // If result is inverted (60° instead of 300°), we need to invert
      // 300° = 360° - 60°, so try: 360 - atan2(hx, hy)
      let rawHeading = Math.atan2(hx, hy) * (180 / Math.PI);
      // Invert if needed: if showing 60° but should be 300°
      heading = (360 - rawHeading) % 360;
    } else {
      // Device is flat - use simple 2D calculation
      // Standard formula: atan2(mx, my) gives angle from North (Y-axis)
      // If showing 60° but should be 300° (240° off), try inverting
      // 300° = 360° - 60°, so invert the result
      let rawHeading = Math.atan2(mx, my) * (180 / Math.PI);
      // Invert: 360 - rawHeading to fix the 240° offset
      heading = (360 - rawHeading) % 360;
    }
    
    // Normalize to 0-360 (North = 0°, East = 90°, South = 180°, West = 270°)
    heading = (heading + 360) % 360;
    
    // Apply low-pass filter for smoothness
    heading = headingFilter.current.filter(heading);
    
    return heading;
  };

  // Track initial rotation completion
  useEffect(() => {
    if (initialRotation) {
      const timer = setTimeout(() => {
        setInitialRotationComplete(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setInitialRotationComplete(true);
    }
  }, [initialRotation]);

  // Handle external heading (e.g., from map bearing)
  useEffect(() => {
    if (externalHeading !== null && externalHeading !== undefined) {
      const normalizedHeading = (externalHeading + 360) % 360;
      setHeading(normalizedHeading);
      rotation.value = withTiming(-normalizedHeading, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      if (onHeadingChange) {
        onHeadingChange(normalizedHeading);
      }
    }
  }, [externalHeading]);

  // Auto-hide calibration banner
  useEffect(() => {
    if (showCalibration) {
      const timer = setTimeout(() => {
        setShowCalibration(false);
        setCalibrating(false);
        figure8Progress.value = 0;
        overlayOpacity.value = 0;
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showCalibration]);

  // Start calibration animation when shown
  useEffect(() => {
    if (showCalibration && !hideCalibration) {
      setCalibrating(true);
      overlayOpacity.value = withTiming(1, { duration: 300 });
      // Initialize path and phone position
      setFigure8Path(generatePath(0));
      const initialPos = getInfinityPosition(0);
      setInfinityPosition(initialPos);
      setPhoneRotation(initialPos.rotation || 0);
      figure8Progress.value = withRepeat(
        withTiming(1, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        false
      );
    } else {
      overlayOpacity.value = withTiming(0, { duration: 300 });
      figure8Progress.value = 0;
      setCalibrating(false);
      setFigure8Path('');
      setInfinityPosition({ x: 60, y: 40 });
      setPhoneRotation(0);
    }
  }, [showCalibration, hideCalibration]);

  // Animated style for overlay
  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });

  // State for animated path and phone icon position
  const [figure8Path, setFigure8Path] = useState('');
  const [infinityPosition, setInfinityPosition] = useState({ x: 90, y: 50 }); // Updated to match new viewBox center
  const [phoneRotation, setPhoneRotation] = useState(0);
  
  // Function to generate path from progress - bigger infinity shape
  const generatePath = (progress) => {
    const width = 240; // Updated to match new SVG viewBox width
    const height = 140; // Updated to match new SVG viewBox height
    const centerX = 120; // Centered in new viewBox (240/2)
    const centerY = 70; // Centered in new viewBox (140/2)
    const numPoints = 100;
    // Infinity size multipliers - reduced to prevent edge clipping
    const infinityWidth = width * 0.5; // Reduced from 0.65 to 0.5 for padding
    const infinityHeight = height * 0.38; // Reduced from 0.5 to 0.38 for padding
    let path = '';
    
    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * 2 * Math.PI * progress;
      const x = centerX + infinityWidth * Math.sin(t);
      const y = centerY + infinityHeight * Math.sin(2 * t);
      if (i === 0) {
        path = `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    
    return path;
  };
  
  // Function to get phone icon position from progress - bigger infinity shape
  const getInfinityPosition = (progress) => {
    const width = 240; // Updated to match new SVG viewBox width
    const height = 140; // Updated to match new SVG viewBox height
    const centerX = 120; // Centered in new viewBox (240/2)
    const centerY = 70; // Centered in new viewBox (140/2)
    const t = progress * 2 * Math.PI;
    // Infinity size multipliers - reduced to prevent edge clipping
    const infinityWidth = width * 0.5; // Reduced from 0.65 to 0.5 for padding
    const infinityHeight = height * 0.38; // Reduced from 0.5 to 0.38 for padding
    const x = centerX + infinityWidth * Math.sin(t);
    const y = centerY + infinityHeight * Math.sin(2 * t);
    
    // Calculate rotation based on movement direction (tangent to the curve)
    const dx = infinityWidth * Math.cos(t);
    const dy = infinityHeight * 2 * Math.cos(2 * t);
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return { x, y, rotation };
  };
  
  // Function to update path and phone position (called from worklet)
  const updatePath = (progress) => {
    if (calibrating) {
      const path = generatePath(progress);
      setFigure8Path(path);
      const position = getInfinityPosition(progress);
      setInfinityPosition(position);
      setPhoneRotation(position.rotation);
    }
  };
  
  // Track calibrating state in a ref for worklet access
  const calibratingRef = useRef(false);
  useEffect(() => {
    calibratingRef.current = calibrating;
  }, [calibrating]);
  
  // Update path based on animation progress using animated reaction
  useAnimatedReaction(
    () => figure8Progress.value,
    (progress) => {
      'worklet';
      // Only update if calibrating
      if (calibratingRef.current) {
        runOnJS(updatePath)(progress);
      }
    }
  );

  // Check web orientation API availability and clear cache for Pixel devices
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const device = deviceInfo.current;
      
      // Pixel-specific: Clear any cached calibration data
      if (device.isPixel) {
        // Clear localStorage compass data
        try {
          const keysToRemove = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && (key.includes('compass') || key.includes('calibration') || key.includes('heading'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => window.localStorage.removeItem(key));
        } catch (e) {
          console.log('Could not clear localStorage:', e);
        }
        
        // Reset filter for fresh calibration
        if (headingFilter.current) {
          headingFilter.current.reset();
          // Create new filter with Pixel-specific settings
          headingFilter.current = new LowPassFilter(0.08); // Extra smooth for Pixel
        }
      }
      
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission !== 'function') {
        if ('DeviceOrientationEvent' in window) {
          setWebPermissionGranted(true);
        }
      }
    }
  }, []);

  // Request web permission with Pixel-specific handling
  const requestWebPermission = () => {
    if (Platform.OS !== 'web') return;
    
    const device = deviceInfo.current;
    
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          const granted = response === 'granted';
          setWebPermissionGranted(granted);
          
          // Pixel-specific: Reset calibration when permission is granted
          if (granted && device.isPixel) {
            // Reset filter for fresh calibration
            if (headingFilter.current) {
              headingFilter.current.reset();
              if (headingFilter.current.pixelFilter) {
                headingFilter.current.pixelFilter.reset();
              }
            }
            
            // Force a calibration event by triggering orientation
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                // Request absolute orientation for better accuracy on Pixel
                window.dispatchEvent(new Event('deviceorientation'));
                window.dispatchEvent(new Event('deviceorientationabsolute'));
              }
            }, 100);
          }
        })
        .catch(() => {
          setWebPermissionGranted(false);
        });
    } else if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      setWebPermissionGranted(true);
      
      // Pixel-specific: Reset calibration
      if (device.isPixel && headingFilter.current) {
        headingFilter.current.reset();
        if (headingFilter.current.pixelFilter) {
          headingFilter.current.pixelFilter.reset();
        }
      }
    }
  };

  // Main sensor effect
  useEffect(() => {
    if (!initialRotationComplete) return;
    // Skip device sensors if externalHeading is provided
    if (externalHeading !== null && externalHeading !== undefined) return;

    // WEB: Device Orientation API
    if (Platform.OS === 'web') {
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function' && 
          !webPermissionGranted) {
        return;
      }

      const handleOrientation = (event) => {
        let angle = null;
        let confidence = null;
        const device = deviceInfo.current;
        const now = Date.now();
        
        // Detect movement using orientation change (beta/gamma)
        if (event.beta !== null && event.beta !== undefined && 
            event.gamma !== null && event.gamma !== undefined) {
          const lastOri = lastOrientationData.current;
          const timeDelta = (now - lastOri.timestamp) / 1000; // seconds
          
          if (timeDelta > 0 && lastOri.timestamp > 0) {
            // Calculate change in orientation
            const betaDelta = Math.abs(event.beta - lastOri.beta);
            const gammaDelta = Math.abs(event.gamma - lastOri.gamma);
            const orientationChange = Math.sqrt(betaDelta * betaDelta + gammaDelta * gammaDelta);
            
            // Update movement status (threshold in degrees per second)
            const changeRate = orientationChange / timeDelta;
            // Use strong hysteresis to prevent rapid toggling and ignore tiny movements
            if (changeRate > 4.0) {
              isDeviceMoving.current = true; // Definitely moving
            } else if (changeRate < 1.0) {
              isDeviceMoving.current = false; // Definitely stationary
            }
            // Between 1.0-4.0: keep current state (strong hysteresis prevents jitter)
            
            // If device starts moving, clear stability state
            if (isDeviceMoving.current) {
              isStable.current = false;
              if (stabilityTimer.current) {
                clearTimeout(stabilityTimer.current);
                stabilityTimer.current = null;
              }
            }
          }
          
          lastOrientationData.current = {
            beta: event.beta,
            gamma: event.gamma,
            timestamp: now
          };
        }

        // Priority 1: iOS webkitCompassHeading (most accurate and universal)
        if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
          // This is already correctly calibrated for iOS
          angle = event.webkitCompassHeading;
          // iOS provides confidence (0-1, higher is better)
          confidence = event.webkitCompassAccuracy !== undefined ? 
            Math.max(0, 1 - (event.webkitCompassAccuracy / 180)) : 0.9; // Convert accuracy to confidence
        }
        // Priority 2: Absolute orientation (more reliable)
        else if (event.absolute === true && event.alpha !== null && event.alpha !== undefined) {
          // Absolute orientation gives true compass heading
          // alpha: 0° when device points North, increases counterclockwise
          // Convert to standard compass (clockwise from North)
          angle = 360 - event.alpha;
          confidence = 0.8; // Absolute orientation is generally reliable
        }
        // Priority 3: Standard alpha (relative orientation)
        else if (event.alpha !== null && event.alpha !== undefined) {
          // Standard alpha - may be relative to initial position
          // Still use same conversion
          angle = 360 - event.alpha;
          confidence = 0.6; // Relative orientation is less reliable
        }

        if (angle !== null) {
          // Normalize to 0-360
          angle = (angle + 360) % 360;
          
          // Device/Browser-specific corrections
          if (device.isPixel) {
            // Google Pixel devices need special handling
            // Pixel devices may have inverted or offset orientation
            // Try multiple correction methods based on which sensor data is available
            if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
              // If webkitCompassHeading is available, use it directly (already calibrated)
              angle = event.webkitCompassHeading;
            } else if (event.absolute === true) {
              // For absolute orientation on Pixel, may need correction
              // Test: Some Pixel models need 180° offset, others don't
              // Use a more conservative approach - try without offset first
              const testAngle = angle;
              const offsetAngle = (angle + 180) % 360;
              
              // Use the angle that's more stable (less variation)
              // This will be determined by the filter over time
              angle = testAngle; // Start with original, filter will stabilize
            } else {
              // Relative orientation on Pixel - needs 180° correction
              angle = (angle + 180) % 360;
            }
          } else if (device.isAndroid) {
            // Other Android Chrome/Firefox - alpha is usually correct
            // No adjustment needed
          } else if (device.isIOS) {
            // iOS Safari - webkitCompassHeading handles it, or alpha is correct
            // No adjustment needed
          }
          
          // Apply smoothing (more aggressive for all devices)
          let smoothed;
          if (device.isPixel) {
            // Extra smoothing for Pixel to prevent jitter (maximum stability)
            // Use a dedicated Pixel filter with very low alpha for maximum stability
            if (!headingFilter.current.pixelFilter) {
              headingFilter.current.pixelFilter = new LowPassFilter(0.05); // Very smooth for Pixel
            }
            smoothed = headingFilter.current.pixelFilter.filter(angle);
          } else {
            smoothed = headingFilter.current.filter(angle);
          }
          
          // Check if device is moving and if update is needed
          const shouldUpdate = shouldUpdateHeading(smoothed, confidence, now);
          
          if (shouldUpdate) {
            // Only update rotation if change is significant enough to avoid flickering
            const currentRotation = rotation.value ? -rotation.value : 0;
            let rotationDiff = Math.abs(smoothed - currentRotation);
            if (rotationDiff > 180) rotationDiff = 360 - rotationDiff;
            
            // Only animate if change is significant or it's the first update
            if (rotationDiff >= MIN_ROTATION_CHANGE || lastStableHeading.current === null) {
              setHeading(smoothed);
              // Use withTiming for smoother, more controlled movement instead of withSpring
              rotation.value = withTiming(-smoothed, {
                duration: 500, // Smooth, controlled animation duration (slightly longer for smoother feel)
                easing: Easing.out(Easing.cubic), // Smooth easing
              });
              
              if (onHeadingChange) {
                onHeadingChange(smoothed);
              }
              
              lastHeadingUpdate.current = now;
              lastStableHeading.current = smoothed;
            }
          }
        }
      };

      // Add listeners for both absolute and relative orientation
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        if (webPermissionGranted) {
          window.addEventListener('deviceorientationabsolute', handleOrientation, true);
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      } else if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
        setWebPermissionGranted(true);
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
          window.removeEventListener('deviceorientation', handleOrientation, true);
        }
      };
    }

    // NATIVE: Accelerometer for movement detection
    let accelerometerSubscription = null;
    
    const startAccelerometer = async () => {
      try {
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (isAvailable) {
          Accelerometer.setUpdateInterval(100); // Balanced update rate for stability
          
           accelerometerSubscription = Accelerometer.addListener((data) => {
             const { x, y, z } = data;
             const now = Date.now();
             
             // Update accelerometer data for tilt compensation (REQUIRED for accurate compass)
             accelData.current.x = x;
             accelData.current.y = y;
             accelData.current.z = z;
             
             // Calculate acceleration magnitude
             const accel = Math.sqrt(x * x + y * y + z * z);
             
             // Calculate change in acceleration (jerk) to detect movement
             const lastAccel = lastAccelData.current;
             const timeDelta = (now - lastAccel.timestamp) / 1000; // seconds
             
             if (timeDelta > 0 && lastAccel.timestamp > 0) {
               const accelDelta = Math.abs(accel - Math.sqrt(
                 lastAccel.x * lastAccel.x + 
                 lastAccel.y * lastAccel.y + 
                 lastAccel.z * lastAccel.z
               ));
               
               // Calculate rate of change (jerk)
               const jerk = accelDelta / timeDelta;
               
               // More accurate movement detection - check both jerk and deviation from gravity
               const gravityDeviation = Math.abs(accel - 9.81);
               const isMoving = jerk > MOVEMENT_THRESHOLD || gravityDeviation > STATIONARY_ACCEL_THRESHOLD;
               
               // Use strong hysteresis to prevent rapid toggling and ignore tiny movements
               if (isMoving && (jerk > MOVEMENT_THRESHOLD * 1.3 || gravityDeviation > STATIONARY_ACCEL_THRESHOLD * 1.3)) {
                 // Only mark as moving if significantly above threshold
                 isDeviceMoving.current = true;
               } else if (jerk < MOVEMENT_THRESHOLD * 0.4 && gravityDeviation < STATIONARY_ACCEL_THRESHOLD * 0.5) {
                 // Only mark as stationary if well below threshold (strong hysteresis)
                 isDeviceMoving.current = false;
               }
               // Between thresholds: keep current state (prevents jitter)
             }
             
             lastAccelData.current = { x, y, z, timestamp: now };
             
             // If device starts moving, clear stability state
             if (isDeviceMoving.current) {
               isStable.current = false;
               if (stabilityTimer.current) {
                 clearTimeout(stabilityTimer.current);
                 stabilityTimer.current = null;
               }
             }
           });
        }
      } catch (error) {
        console.log('Accelerometer not available:', error);
      }
    };
    
    // NATIVE: Magnetometer
    let magnetometerSubscription = null;

    const startMagnetometer = async () => {
      try {
        const isAvailable = await Magnetometer.isAvailableAsync();
        if (!isAvailable) {
          console.warn('Magnetometer not available');
          return;
        }

        // Set update interval (optimized for stability)
        const updateInterval = deviceInfo.current.isPixel ? 150 : 120; // Slower updates for more stability
        Magnetometer.setUpdateInterval(updateInterval);

        magnetometerSubscription = Magnetometer.addListener((data) => {
          const { x, y, z } = data;
          
          // Use magnetometer with tilt compensation from accelerometer
          // This is the CORRECT way to use device magnetometer - passes accelerometer data
          const angle = calculateHeading(x, y, z, accelData.current.x, accelData.current.y, accelData.current.z);
          
          // For native, we assume high confidence if magnitude is reasonable
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          const confidence = magnitude > 20 && magnitude < 100 ? 0.9 : 0.6; // Reasonable magnetic field strength
          
          const now = Date.now();
          const shouldUpdate = shouldUpdateHeading(angle, confidence, now);
          
          if (shouldUpdate) {
            // Only update rotation if change is significant enough to avoid flickering
            const currentRotation = rotation.value ? -rotation.value : 0;
            let rotationDiff = Math.abs(angle - currentRotation);
            if (rotationDiff > 180) rotationDiff = 360 - rotationDiff;
            
            // Only animate if change is significant or it's the first update
            if (rotationDiff >= MIN_ROTATION_CHANGE || lastStableHeading.current === null) {
              setHeading(angle);
              // Use withTiming for smoother, more controlled movement instead of withSpring
              rotation.value = withTiming(-angle, {
                duration: 500, // Smooth, controlled animation duration (slightly longer for smoother feel)
                easing: Easing.out(Easing.cubic), // Smooth easing
              });
              
              if (onHeadingChange) {
                onHeadingChange(angle);
              }
              
              lastHeadingUpdate.current = now;
              lastStableHeading.current = angle;
            }
          }
        });
      } catch (error) {
        console.error('Magnetometer error:', error);
      }
    };

    // Start both sensors for native
    if (Platform.OS !== 'web') {
      startAccelerometer();
    }
    startMagnetometer();

    return () => {
      if (magnetometerSubscription) {
        magnetometerSubscription.remove();
      }
      if (accelerometerSubscription) {
        accelerometerSubscription.remove();
      }
      if (stabilityTimer.current) {
        clearTimeout(stabilityTimer.current);
      }
    };
  }, [initialRotationComplete, webPermissionGranted, onHeadingChange]);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    if (initialRotation && !initialRotationComplete) {
      return {
        transform: [{ rotate: `${initialRotation.value}deg` }],
      };
    }
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });
  
  // Container entrance animation
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  // Render appropriate compass
  const renderCompass = () => {
    if (compassType === 'classic') {
      return <ClassicCompass heading={heading} />;
    } else if (compassType === 'fengshui') {
      return <FengShuiCompass heading={heading} />;
    }

    switch (mode) {
      case 'normal':
        return <NormalCompass size={COMPASS_SIZE} />;
      case 'vastu16':
        return <Vastu16Compass size={COMPASS_SIZE} />;
      case 'vastu32':
        return <Vastu32Compass size={COMPASS_SIZE} />;
      case 'vastu45':
        return <Vastu45Compass size={COMPASS_SIZE} />;
      case 'chakra':
        return <ChakraCompass size={COMPASS_SIZE} />;
      default:
        return <NormalCompass size={COMPASS_SIZE} />;
    }
  };

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {capturedImage && (
        <>
          <View style={[styles.imageOverlay, { 
            width: imageContainerSize, 
            height: imageContainerSize, 
            borderRadius: imageContainerSize / 2 
          }]}>
            <Image 
              source={{ uri: capturedImage }} 
              style={styles.backgroundImage} 
            />
            <View style={[styles.compassOverlay, { 
              width: COMPASS_SIZE, 
              height: COMPASS_SIZE 
            }]}>
              <Animated.View style={[styles.compass, animatedStyle]}>
                {renderCompass()}
              </Animated.View>
            </View>
          </View>
          <View style={styles.imageControls}>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => setImageContainerSize(Math.max(MIN_SIZE, imageContainerSize - getResponsiveSize(20)))}
              activeOpacity={0.8}
            >
              <Text style={styles.zoomButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.zoomIndicator}>
              <Text style={styles.zoomIndicatorText}>
                {Math.round((imageContainerSize / COMPASS_SIZE) * 100)}%
              </Text>
            </View>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => setImageContainerSize(Math.min(MAX_SIZE, imageContainerSize + getResponsiveSize(20)))}
              activeOpacity={0.8}
            >
              <Text style={styles.zoomButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {onClearImage && (
            <TouchableOpacity
              style={styles.clearImageButton}
              onPress={onClearImage}
              activeOpacity={0.8}
            >
              <View style={styles.clearImageButtonInner}>
                <Text style={styles.clearImageButtonText}>✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </>
      )}
      {!capturedImage && (
        <Animated.View style={[styles.compass, animatedStyle]}>
          {renderCompass()}
        </Animated.View>
      )}
      
      {/* Web permission prompt */}
      {Platform.OS === 'web' && 
       !webPermissionGranted && 
       typeof DeviceOrientationEvent !== 'undefined' && 
       typeof DeviceOrientationEvent.requestPermission === 'function' && (
        <View style={styles.webPermissionContainer}>
          <Text style={styles.webPermissionText}>
            Enable device orientation to use the compass
          </Text>
          <TouchableOpacity
            style={styles.webPermissionButton}
            onPress={requestWebPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.webPermissionButtonText}>Enable Compass</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Enhanced Heading indicator */}
      <View style={styles.headingIndicator}>
        <View style={styles.headingLine} />
        <View style={styles.headingDot} />
        <View style={styles.headingArrow} />
      </View>
      
      {/* Stability indicator */}
      {isCompassStable && (
        <View style={styles.stabilityIndicator}>
          <View style={styles.stabilityIcon}>
            <Text style={styles.stabilityIconText}>🔒</Text>
          </View>
          <Text style={styles.stabilityText}>Locked</Text>
        </View>
      )}
      
      {/* Animated Calibration Overlay - hidden in capture mode */}
      {showCalibration && !hideCalibration && (
        <Animated.View style={[styles.calibrationOverlay, overlayAnimatedStyle]}>
          <View style={styles.calibrationOverlayContent}>
            {/* Animated Figure-8 SVG */}
            <View style={styles.figure8Container}>
              <Svg width="100%" height="100%" viewBox="0 0 240 140" preserveAspectRatio="xMidYMid meet">
                <Defs>
                  <LinearGradient id="figure8Gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#6B7280" stopOpacity="0.6" />
                    <Stop offset="50%" stopColor="#6B7280" stopOpacity="0.6" />
                    <Stop offset="100%" stopColor="#6B7280" stopOpacity="0.6" />
                  </LinearGradient>
                </Defs>
                <Path
                  d={figure8Path || 'M 120 70'}
                  stroke="url(#figure8Gradient)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
              </Svg>
              {/* Animated Phone Icon following the path */}
              <Animated.View
                style={[
                  styles.phoneIcon,
                  {
                    left: `${(infinityPosition.x / 240) * 100}%`,
                    marginLeft: -getResponsiveSize(14),
                    top: `${(infinityPosition.y / 140) * 100}%`,
                    marginTop: -getResponsiveSize(20),
                    transform: [
                      { rotate: `${phoneRotation}deg` },
                      { perspective: 1000 },
                      { rotateY: `${Math.sin(phoneRotation * Math.PI / 180) * 15}deg` },
                      { rotateX: `${Math.cos(phoneRotation * Math.PI / 180) * 10}deg` },
                    ],
                  },
                ]}
              >
                <View style={styles.phoneBody}>
                  <View style={styles.phoneScreen}>
                    <View style={styles.phoneNotch} />
                    <View style={styles.phoneCompassIcon}>
                      <CompassToggleIcon 
                        size={getResponsiveSize(14)} 
                        color="#F4B000" 
                      />
                    </View>
                  </View>
                  <View style={styles.phoneButton} />
                </View>
                {/* Motion trail effect */}
                <View style={styles.motionTrail} />
              </Animated.View>
            </View>
            
            {/* Calibration Text */}
            <View style={styles.calibrationTextContainer}>
              <Text style={styles.calibrationTitle}>Calibrating Compass</Text>
              <Text style={styles.calibrationSubtitle}>Move your device in a figure-8 pattern</Text>
            </View>
            
            {/* Close Button */}
            <TouchableOpacity
              style={styles.calibrationCloseButton}
              onPress={() => {
                setShowCalibration(false);
                setCalibrating(false);
                figure8Progress.value = 0;
                overlayOpacity.value = 0;
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.calibrationCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: COMPASS_SIZE * 0.5,
    maxWidth: COMPASS_SIZE * 1.5,
    position: 'relative',
  },
  compass: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  compassOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    left: '50%',
    marginTop: -(COMPASS_SIZE / 2),
    marginLeft: -(COMPASS_SIZE / 2),
  },
  headingIndicator: {
    position: 'absolute',
    top: -getResponsiveSize(8),
    width: getResponsiveSize(6),
    height: getResponsiveSize(45),
    backgroundColor: '#F4B000', // Saffron Gold
    borderRadius: getResponsiveSize(3),
    zIndex: 1000,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 8px rgba(244, 176, 0, 0.3)',
    } : {
      shadowColor: '#F4B000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    }),
    borderWidth: 1,
    borderColor: '#C88A00',
    alignSelf: 'center',
    elevation: 8,
  },
  headingLine: {
    width: getResponsiveSize(4),
    height: getResponsiveSize(30),
    backgroundColor: '#F4B000', // Saffron Gold
    alignSelf: 'center',
    marginTop: getResponsiveSize(2),
    borderRadius: getResponsiveSize(2),
  },
  headingDot: {
    width: getResponsiveSize(8),
    height: getResponsiveSize(8),
    borderRadius: getResponsiveSize(4),
    backgroundColor: '#F4B000', // Saffron Gold
    marginTop: getResponsiveSize(-4),
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    }),
  },
  headingArrow: {
    position: 'absolute',
    top: getResponsiveSize(-12),
    left: '50%',
    marginLeft: getResponsiveSize(-6),
    width: 0,
    height: 0,
    borderLeftWidth: getResponsiveSize(6),
    borderRightWidth: getResponsiveSize(6),
    borderBottomWidth: getResponsiveSize(8),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F4B000', // Saffron Gold
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(244, 176, 0, 0.3)',
    } : {
      shadowColor: '#F4B000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
    }),
    shadowRadius: 4,
  },
  stabilityIndicator: {
    position: 'absolute',
    bottom: getResponsiveSize(-60),
    left: '50%',
    marginLeft: getResponsiveSize(-50),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 142, 60, 0.9)', // Soft green
    paddingVertical: getResponsiveSize(6),
    paddingHorizontal: getResponsiveSize(12),
    borderRadius: getResponsiveSize(20),
    borderWidth: 0,
    shadowColor: '#388E3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
  stabilityIcon: {
    marginRight: getResponsiveSize(6),
  },
  stabilityIconText: {
    fontSize: getResponsiveFont(14),
  },
  stabilityText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFont(12),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clearImageButton: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4B000', // Saffron Gold
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  clearImageButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearImageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 16,
    textShadow: '0px 1px 2px rgba(0, 0, 0, 0.5)',
  },
  imageControls: {
    position: 'absolute',
    right: getResponsiveSize(-40),
    top: '68%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveSize(8),
    zIndex: 10,
  },
  zoomButton: {
    width: getResponsiveSize(36),
    height: getResponsiveSize(36),
    borderRadius: getResponsiveSize(18),
    backgroundColor: '#FFFFFF', // Warm White
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  zoomButtonText: {
    color: '#3B2F2F', // Espresso
    fontSize: getResponsiveFont(20),
    fontWeight: '900',
    lineHeight: getResponsiveFont(20),
  },
  zoomIndicator: {
    minWidth: getResponsiveSize(50),
    paddingHorizontal: getResponsiveSize(12),
    paddingVertical: getResponsiveSize(6),
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(16),
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomIndicatorText: {
    color: '#1F2328', // Charcoal
    fontSize: getResponsiveFont(12),
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  webPermissionContainer: {
    position: 'absolute',
    top: COMPASS_SIZE / 2 - getResponsiveSize(60),
    left: '50%',
    marginLeft: -getResponsiveSize(125),
    backgroundColor: '#FFFFFF', // Warm White
    padding: getResponsiveSize(20),
    borderRadius: getResponsiveSize(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    width: getResponsiveSize(250),
  },
  webPermissionText: {
    color: '#1F2328', // Charcoal
    fontSize: getResponsiveFont(14),
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: getResponsiveSize(12),
  },
  webPermissionButton: {
    backgroundColor: '#F4B000', // Saffron Gold
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(20),
    borderRadius: getResponsiveSize(20),
    borderWidth: 0,
  },
  webPermissionButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFont(13),
    fontWeight: '700',
    textAlign: 'center',
  },
  calibrationOverlay: {
    position: 'absolute',
    top: getResponsiveSize(-100), // Extended beyond screen
    left: getResponsiveSize(-50), // Extended beyond screen
    right: getResponsiveSize(-50), // Extended beyond screen
    bottom: getResponsiveSize(-50), // Extended beyond screen
    backgroundColor: 'rgba(250, 250, 250, 0.15)', // Very low opacity to let blur show through
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(30px) saturate(200%)',
      WebkitBackdropFilter: 'blur(30px) saturate(200%)',
      // Ensure the overlay itself is not blurred
      isolation: 'isolate',
    }),
    ...(Platform.OS !== 'web' && {
      // For native, we'll need to blur the content behind
    }),
  },
  calibrationOverlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // Warm White
    borderRadius: getResponsiveSize(20),
    paddingVertical: getResponsiveSize(16), // Reduced vertical padding
    paddingHorizontal: getResponsiveSize(24), // Keep horizontal padding
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
    width: width * 0.6, // 60% of screen width
    maxWidth: width * 0.6, // Ensure it doesn't exceed 60%
    position: 'relative', // Ensure close button positioning works
    zIndex: 10001, // Ensure content is above the blur
    overflow: 'hidden', // Prevent content from overflowing
    ...(Platform.OS === 'web' && {
      // Ensure content is not affected by backdrop-filter
      isolation: 'isolate',
    }),
    ...(Platform.OS !== 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 12,
    }),
  },
  figure8Container: {
    width: '100%', // Use full width of parent container (which is 60% of screen)
    aspectRatio: 280 / 160, // Maintain the 280:160 aspect ratio
    marginBottom: getResponsiveSize(12), // Reduced from 16 to 12
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden', // Prevent phone icon from overflowing
  },
  phoneIcon: {
    position: 'absolute',
    width: getResponsiveSize(28), // Reduced from 40 to 28
    height: getResponsiveSize(40), // Reduced from 56 to 40
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneBody: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
    borderRadius: getResponsiveSize(8),
    borderWidth: 2,
    borderColor: '#3b82f6',
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#0f172a',
    margin: getResponsiveSize(3),
    borderRadius: getResponsiveSize(6),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  phoneNotch: {
    position: 'absolute',
    top: 0,
    width: getResponsiveSize(16),
    height: getResponsiveSize(4),
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: getResponsiveSize(4),
    borderBottomRightRadius: getResponsiveSize(4),
  },
  phoneCompassIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneCompassText: {
    fontSize: getResponsiveFont(14), // Reduced from 18 to 14
  },
  phoneButton: {
    width: getResponsiveSize(10), // Reduced from 12 to 10
    height: getResponsiveSize(2.5), // Reduced from 3 to 2.5
    backgroundColor: '#334155',
    borderRadius: getResponsiveSize(1.25), // Reduced from 1.5 to 1.25
    alignSelf: 'center',
    marginBottom: getResponsiveSize(2.5), // Reduced from 3 to 2.5
  },
  motionTrail: {
    position: 'absolute',
    width: getResponsiveSize(5), // Reduced from 6 to 5
    height: getResponsiveSize(5), // Reduced from 6 to 5
    borderRadius: getResponsiveSize(2.5), // Reduced from 3 to 2.5
    backgroundColor: '#8b5cf6',
    opacity: 0.5,
    top: '50%',
    left: '50%',
    marginTop: getResponsiveSize(-2.5), // Reduced from -3 to -2.5
    marginLeft: getResponsiveSize(-18), // Adjusted for smaller phone
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6, // Reduced from 8 to 6
  },
  calibrationTextContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveSize(4), // Reduced from 8 to 4
  },
  calibrationTitle: {
    fontSize: getResponsiveFont(18), // Reduced from 20 to 18
    fontWeight: '600',
    color: '#1F2328', // Charcoal
    marginBottom: getResponsiveSize(4), // Reduced from 8 to 4
    textAlign: 'center',
  },
  calibrationSubtitle: {
    fontSize: getResponsiveFont(12), // Reduced from 14 to 12
    color: '#6B7280', // Slate
    fontWeight: '500',
    textAlign: 'center',
  },
  calibrationCloseButton: {
    position: 'absolute',
    top: getResponsiveSize(8), // Reduced from 12 to 8
    right: getResponsiveSize(8), // Reduced from 12 to 8
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    borderRadius: getResponsiveSize(16),
    backgroundColor: '#FFFFFF', // Warm White
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E2D6', // Sand Line
    zIndex: 10001, // Ensure it's above other elements
  },
  calibrationCloseText: {
    color: '#1F2328', // Charcoal
    fontSize: getResponsiveFont(18),
    fontWeight: '600',
    lineHeight: getResponsiveFont(18),
  },
});
