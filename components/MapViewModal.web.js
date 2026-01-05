import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Linking,
} from 'react-native';
import CompassView from './CompassView';
import CompassTopBar from './CompassTopBar';
import LocationSearch from './LocationSearch';
import Sidebar from './Sidebar';
import { useI18n, translateDevta as translateDevtaName } from '../utils/i18n';
import { 
  DownloadIcon, 
  RecenterIcon, 
  LockIcon, 
  PinIcon, 
  CompassToggleIcon, 
  MapLayerIcon 
} from './svgs';
import Svg, { Path, Circle } from 'react-native-svg';

// Expert Icon Component
const ExpertIcon = ({ size = 20, color = "#2C2C2C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M6 21C6 17 8 15 12 15C16 15 18 17 18 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 11V13M12 5V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// Chat Icon Component
const ChatIcon = ({ size = 24, color = "#FFFFFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
// Removed mapUtils imports - using simple inline calculations instead
import {
  VASTU_GRID_9X9,
  getBrahmasthanCells,
} from '../utils/vastuGrid';
import {
  OUTER_LAYER,
  MIDDLE_LAYER,
  CENTER_LAYER,
  getAll45Devtas,
} from '../utils/vastuGrid45';
import { GRID_STRUCTURE, drawVastuGrid as drawVastuGridUtil } from '../utils/gridStructure';
import { colors } from '../utils/theme';

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
  
  const effectiveWidth = Math.min(width, 600);
  const scale = effectiveWidth / 375;
  return Math.max(size * scale, size * 0.8);
};

const getResponsiveFont = (size) => {
  const { width } = getDimensions();
  if (!width || width === 0) return size;
  
  const effectiveWidth = Math.min(width, 600);
  const scale = effectiveWidth / 375;
  return Math.max(size * scale, size * 0.85);
};

export default function MapViewModal({ visible, onClose, mode, compassType, selectedLocation, onCompassTypeChange }) {
  const { t, language, translateDevta } = useI18n();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  
  // Use Classic Compass as default fallback if no compass type specified
  const effectiveCompassType = compassType || 'classic';
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState('satellite');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [mapLocation, setMapLocation] = useState(null);
  const [showCompass, setShowCompass] = useState(true);
  const [isMapLocked, setIsMapLocked] = useState(false);
  const [pressedButton, setPressedButton] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  
  // Animated text state for Expert button
  const [expertText, setExpertText] = useState('');
  const expertSentences = [
    "Get personalized guidance",
    "Expert Vastu consultations",
    "Transform your space",
    "Balance energy & harmony"
  ];
  const [currentSentence, setCurrentSentence] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  
  // VASTU GRID STATE
  const [plotCorners, setPlotCorners] = useState([]);
  const [cornerSelectionMode, setCornerSelectionMode] = useState(false);
  const [showVastuGrid, setShowVastuGrid] = useState(false);
  
  // Check sessionStorage for guide visibility (only show once per session)
  const getSessionBannerState = (key, defaultValue) => {
    if (typeof window === 'undefined' || !window.sessionStorage) return defaultValue;
    const stored = window.sessionStorage.getItem(key);
    // If stored value is 'true', it means banner was already shown, so return false (don't show)
    // If stored is null, banner hasn't been shown, so return true (show)
    return stored === 'true' ? false : defaultValue;
  };
  
  const [showCornerBanner, setShowCornerBanner] = useState(() => 
    getSessionBannerState('mapViewCornerBannerShown', true)
  );
  const [showGridBanner, setShowGridBanner] = useState(() => 
    getSessionBannerState('mapViewGridBannerShown', true)
  );
  
  // 3 LAYER TOGGLES
  const [showOuterLayer, setShowOuterLayer] = useState(true);
  const [showMiddleLayer, setShowMiddleLayer] = useState(true);
  const [showCenterLayer, setShowCenterLayer] = useState(true);
  
  // Toast state for pada information
  const [selectedPada, setSelectedPada] = useState(null);
  const gridLayersRef = useRef([]);
  const plotCornersRef = useRef([]);
  const cornerSelectionModeRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const cornerMarkersRef = useRef([]);

  // Add web-specific styles for gradient backgrounds and ensure banners are visible
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const styleId = 'mapViewBannerGradients';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          /* Ensure banners have proper gradients on web */
          [data-testid="corner-banner"] {
            background: linear-gradient(135deg, #FF5722 0%, #FF7043 100%) !important;
            position: relative !important;
            z-index: 999 !important;
            overflow: visible !important;
          }
          [data-testid="grid-banner"] {
            background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%) !important;
            position: relative !important;
            z-index: 999 !important;
            overflow: visible !important;
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    } else {
      // Clean up map when modal closes
      if (googleMapRef.current && window.L) {
        try {
          googleMapRef.current.remove();
          console.log('Map removed successfully');
        } catch (error) {
          console.log('Error removing map:', error);
        }
        googleMapRef.current = null;
      }
      // Reset states
      setShowLocationSearch(false);
      setMapLocation(null);
      setLoading(true);
      setMapReady(false);
      setPlotCorners([]);
      setShowVastuGrid(false);
      setCornerSelectionMode(false);
      cornerMarkersRef.current = [];
      gridLayersRef.current = [];
      plotOutlineRef.current = null;
    }
  }, [visible]);

  // Sync refs with state
  useEffect(() => {
    plotCornersRef.current = plotCorners;
  }, [plotCorners]);

  useEffect(() => {
    cornerSelectionModeRef.current = cornerSelectionMode;
    console.log('📌 Corner selection mode:', cornerSelectionMode);
    // Show banner only if it hasn't been shown this session
    if (cornerSelectionMode) {
      const hasBeenShown = typeof window !== 'undefined' && window.sessionStorage 
        ? window.sessionStorage.getItem('mapViewCornerBannerShown') === 'true'
        : false;
      if (!hasBeenShown) {
        setShowCornerBanner(true);
      }
    }
  }, [cornerSelectionMode]);
  
  // Initialize banners on first visit this session
  useEffect(() => {
    if (visible && typeof window !== 'undefined' && window.sessionStorage) {
      // Check if this is the first time entering this section this session
      const cornerBannerShown = window.sessionStorage.getItem('mapViewCornerBannerShown') === 'true';
      const gridBannerShown = window.sessionStorage.getItem('mapViewGridBannerShown') === 'true';
      
      // Only set to true if not already shown
      if (!cornerBannerShown && cornerSelectionMode) {
        setShowCornerBanner(true);
      }
      if (!gridBannerShown && showVastuGrid) {
        setShowGridBanner(true);
      }
    }
  }, [visible]);

  // Load Leaflet script dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.L) {
      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.async = true;
      script.onload = () => {
        console.log('Leaflet script loaded');
      };
      document.head.appendChild(script);

      // Load Leaflet CSS
      const link = document.createElement('link');
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (visible && !loading && locationToUse && mapContainerRef.current && !googleMapRef.current) {
      const timer = setTimeout(() => {
        initializeLeafletMap();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, loading, currentLocation, selectedLocation]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            });
            setLoading(false);
          },
          (error) => {
            console.log('Error getting web location:', error);
            const fallbackLat = selectedLocation?.latitude || 12.8690724;
            const fallbackLng = selectedLocation?.longitude || 77.6933333;
            setCurrentLocation({
              latitude: fallbackLat,
              longitude: fallbackLng,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            });
            setLoading(false);
          },
          { 
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        setCurrentLocation({
          latitude: selectedLocation?.latitude || 12.8690724,
          longitude: selectedLocation?.longitude || 77.6933333,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        });
        setLoading(false);
      }
    } catch (error) {
      console.log('Error getting location:', error);
      setCurrentLocation({
        latitude: selectedLocation?.latitude || 12.8690724,
        longitude: selectedLocation?.longitude || 77.6933333,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      });
      setLoading(false);
    }
  };

  // Pada descriptions based on Vastu Shastra
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

  // Handle pada click - show toast
  const handlePadaClick = (devtaName, devtaInfo, translatedName) => {
    setSelectedPada({
      name: translatedName,
      devta: devtaName,
      zone: devtaInfo.zone || '',
      energy: devtaInfo.energy || 'neutral',
      description: padaDescriptions[devtaName] || `${translatedName} pada represents a specific energy in Vastu Shastra. Each pada has unique characteristics and should be used appropriately based on its energy type.`
    });
  };

  // Draw Vastu Grid - calls the utility function from gridStructure.js
  const drawVastuGrid = () => {
    drawVastuGridUtil({
      mapRef: googleMapRef.current,
      plotCorners,
      gridLayersRef: gridLayersRef.current,
      cornerMarkersRef: cornerMarkersRef.current,
      showOuterLayer,
      showMiddleLayer,
      showCenterLayer,
      language,
      translateDevtaName,
      getBrahmasthanCells,
      VASTU_GRID_9X9,
      setShowVastuGrid,
      setShowGridBanner,
      onPadaClick: handlePadaClick, // Pass the callback
    });
  };

  // Draw connecting lines between corners while adjusting
  const plotOutlineRef = useRef(null);
  
  useEffect(() => {
    if (!googleMapRef.current || !window.L) return;
    
    // Remove old outline
    if (plotOutlineRef.current) {
      try {
        googleMapRef.current.removeLayer(plotOutlineRef.current);
      } catch (e) {}
      plotOutlineRef.current = null;
    }
    
    // Draw connecting lines when we have corners
    if (plotCorners.length >= 2 && cornerSelectionMode) {
      const coords = plotCorners.map(p => [p.latitude, p.longitude]);
      
      // Create polygon if 4 corners, polyline if less
      if (plotCorners.length === 4) {
        plotOutlineRef.current = window.L.polygon([...coords, coords[0]], {
          color: '#FFD700',
          weight: 3,
          fillColor: '#FFD700',
          fillOpacity: 0.1,
          dashArray: '8, 4',
          opacity: 0.8,
        }).addTo(googleMapRef.current);
      } else {
        plotOutlineRef.current = window.L.polyline(coords, {
          color: '#FFD700',
          weight: 3,
          dashArray: '8, 4',
          opacity: 0.7,
        }).addTo(googleMapRef.current);
      }
    }
  }, [plotCorners, cornerSelectionMode]);

  // Effect to draw grid
  useEffect(() => {
    console.log('🔍 Grid draw useEffect triggered');
    console.log('  - plotCorners.length:', plotCorners.length);
    console.log('  - googleMapRef.current:', !!googleMapRef.current);
    console.log('  - cornerSelectionMode:', cornerSelectionMode);
    
    if (plotCorners.length === 4 && googleMapRef.current && !cornerSelectionMode) {
      console.log('🎨 All conditions met - Drawing grid with layers:', { 
        outer: showOuterLayer, 
        middle: showMiddleLayer, 
        center: showCenterLayer 
      });
      
      // Small delay to ensure corner markers are removed first
      const timer = setTimeout(() => {
        try {
          // Verify map still exists
          if (!googleMapRef.current) {
            console.error('❌ Map reference lost!');
            return;
          }
          
          // Remove plot outline before drawing grid
          if (plotOutlineRef.current) {
            try {
              googleMapRef.current.removeLayer(plotOutlineRef.current);
              console.log('🧹 Removed plot outline');
            } catch (e) {
              console.log('⚠️ Error removing plot outline:', e);
            }
            plotOutlineRef.current = null;
          }
          
          // Draw grid with error handling
          try {
            drawVastuGrid();
          } catch (gridError) {
            console.error('❌ Error in drawVastuGrid:', gridError);
            alert('Error drawing grid. Please try again.');
          }
        } catch (error) {
          console.error('❌ Critical error in grid drawing useEffect:', error);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      console.log('⏸️ Not drawing grid - conditions not met');
    }
  }, [plotCorners, showOuterLayer, showMiddleLayer, showCenterLayer, cornerSelectionMode, language]);

  // AUTO-PLACE DRAGGABLE CORNERS
  useEffect(() => {
    if (!mapReady || !googleMapRef.current || !window.L) return;
    
    if (!cornerSelectionMode) {
      cornerMarkersRef.current.forEach(m => {
        try {
          googleMapRef.current.removeLayer(m);
        } catch (e) {}
      });
      cornerMarkersRef.current = [];
      return;
    }
    
    setTimeout(() => {
      const map = googleMapRef.current;
      const center = map.getCenter();
      const offset = 0.0008;
      
      const autoCorners = [
        { lat: center.lat - offset, lng: center.lng - offset, label: 'BL', name: 'Bottom-Left', direction: 'bottom-left' },
        { lat: center.lat - offset, lng: center.lng + offset, label: 'BR', name: 'Bottom-Right', direction: 'bottom-right' },
        { lat: center.lat + offset, lng: center.lng + offset, label: 'TR', name: 'Top-Right', direction: 'top-right' },
        { lat: center.lat + offset, lng: center.lng - offset, label: 'TL', name: 'Top-Left', direction: 'top-left' },
      ];
      
      // SVG arrow functions for each direction - clear black diagonal arrows with arrowheads
      const getArrowSVG = (direction) => {
        const arrows = {
          // Top-Left: Arrow pointing from center to top-left corner
          'top-left': '<path d="M10 10L1 1M1 1L1 4.5M1 1L4.5 1" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
          // Top-Right: Arrow pointing from center to top-right corner
          'top-right': '<path d="M10 10L19 1M19 1L19 4.5M19 1L15.5 1" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
          // Bottom-Left: Arrow pointing from center to bottom-left corner
          'bottom-left': '<path d="M10 10L1 19M1 19L1 15.5M1 19L4.5 19" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
          // Bottom-Right: Arrow pointing from center to bottom-right corner
          'bottom-right': '<path d="M10 10L19 19M19 19L19 15.5M19 19L15.5 19" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
        };
        return `<svg width="20" height="20" viewBox="0 0 20 20" style="vertical-align: middle; margin-right: 4px; display: inline-block;">${arrows[direction]}</svg>`;
      };
      
      console.log('🔴 PLACING RED DOTS:', autoCorners);
      
      const colors = ['#FF0000', '#FF4444', '#FF6666', '#FF8888'];
      
      autoCorners.forEach((corner, i) => {
        const icon = window.L.divIcon({
          className: `corner-marker-${i}`,
          html: `
            <div style="position: relative; width: 64px; height: 64px; cursor: grab; display: flex; align-items: center; justify-content: center; transform: translateZ(0);">
              <svg width="48" height="48" viewBox="0 0 44 44" style="filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));">
                <defs>
                  <radialGradient id="grad${i}" cx="40%" cy="40%">
                    <stop offset="0%" stop-color="#FF6B6B" stop-opacity="1" />
                    <stop offset="50%" stop-color="#FF3333" stop-opacity="1" />
                    <stop offset="100%" stop-color="#E60000" stop-opacity="1" />
                  </radialGradient>
                  <filter id="lightGlow${i}" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <!-- Outer glow ring -->
                <circle cx="22" cy="22" r="21" fill="none" 
                  stroke="rgba(255,255,255,0.8)" 
                  stroke-width="1.5" 
                  opacity="0.6"/>
                
                <!-- Main circle with gradient -->
                <circle cx="22" cy="22" r="18" fill="url(#grad${i})" 
                  stroke="rgba(255,255,255,0.9)" 
                  stroke-width="2.5" 
                  filter="url(#lightGlow${i})"
                  style="filter: drop-shadow(0 0 6px rgba(255,0,0,0.5)) drop-shadow(0 0 3px rgba(255,255,255,0.6));"/>
                
                <!-- Inner highlight -->
                <circle cx="22" cy="22" r="14" fill="none" 
                  stroke="rgba(255,255,255,0.4)" 
                  stroke-width="1"/>
                
                <!-- Number with better styling -->
                <text x="22" y="27" text-anchor="middle" fill="white" 
                  font-size="18" font-weight="900" font-family="'DM Sans', sans-serif"
                  style="text-shadow: 0 1px 3px rgba(0,0,0,0.5), 0 0 8px rgba(255,0,0,0.6);">${i + 1}</text>
              </svg>
            </div>
          `,
          iconSize: [64, 64],
          iconAnchor: [32, 32],
        });
        
        const marker = window.L.marker([corner.lat, corner.lng], {
          icon,
          draggable: true,
          zIndexOffset: 10000,
        }).addTo(map);
        
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const updated = [...plotCornersRef.current];
          updated[i] = { latitude: pos.lat, longitude: pos.lng };
          setPlotCorners(updated);
        });
        
        marker.bindTooltip(`
          <div style="
            background: linear-gradient(135deg, #FF4444 0%, #CC0000 100%);
            color: white;
            padding: 8px 14px;
            border-radius: 10px;
            font-weight: 800;
            font-size: 12px;
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            border: 2.5px solid white;
            box-shadow: 0 4px 16px rgba(255,0,0,0.5), 0 0 8px rgba(255,255,255,0.3);
            text-align: center;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            white-space: nowrap;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          ">
            ${getArrowSVG(corner.direction)}
            <span style="font-family: 'DM Sans', sans-serif; font-weight: 900;">${corner.name}</span>
          </div>
        `, {
          permanent: true,
          direction: 'top',
          offset: [0, -32],
          className: 'corner-tooltip'
        });
        
        cornerMarkersRef.current.push(marker);
      });
      
      setPlotCorners(autoCorners.map(c => ({ latitude: c.lat, longitude: c.lng })));
      console.log('🎉 RED DOTS PLACED!');
    }, 500);
  }, [mapReady, cornerSelectionMode]);

  const initializeLeafletMap = () => {
    let retryCount = 0;
    const maxRetries = 100;
    
    const checkLeaflet = () => {
      if (retryCount === 0) {
        console.log('Starting Leaflet initialization check...');
      }
      
      if (typeof window !== 'undefined' && window.L && mapContainerRef.current && !googleMapRef.current) {
        try {
          // Only clear if we're initializing for the first time
          if (mapContainerRef.current.innerHTML && !googleMapRef.current) {
            mapContainerRef.current.innerHTML = '';
          }
          
          // Double check map doesn't exist
          if (googleMapRef.current) {
            console.log('Map already exists, skipping initialization');
            return;
          }
          
          const map = window.L.map(mapContainerRef.current, {
            zoomControl: false,
          }).setView([locationToUse.latitude, locationToUse.longitude], 18);

          let tileLayer;
          if (mapType === 'satellite') {
            tileLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Tiles &copy; Esri',
              maxZoom: 19,
            });
          } else {
            tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
            });
          }
          tileLayer.addTo(map);

          window.L.control.zoom({
            position: 'bottomright'
          }).addTo(map);

          const goldIcon = window.L.divIcon({
            className: 'custom-marker',
            html: `<div style="
              width: 30px;
              height: 30px;
              background-color: #F4C430;
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          });

          const marker = window.L.marker([locationToUse.latitude, locationToUse.longitude], {
            icon: goldIcon
          }).addTo(map);
          
          marker.bindPopup(t('info.currentLocation')).openPopup();

          googleMapRef.current = map;
          setMapReady(true);
          console.log('✅ Map ready, setMapReady(true) called');
        } catch (error) {
          console.error('Error initializing Leaflet:', error);
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        if (retryCount % 10 === 0) {
          console.log(`Waiting for Leaflet to load... (attempt ${retryCount}/${maxRetries})`);
        }
        setTimeout(checkLeaflet, 100);
      }
    };
    
    checkLeaflet();
  };

  const changeMapType = () => {
    const newType = mapType === 'satellite' ? 'standard' : 'satellite';
    setMapType(newType);
    
    if (googleMapRef.current && window.L) {
      googleMapRef.current.eachLayer((layer) => {
        if (layer instanceof window.L.TileLayer) {
          googleMapRef.current.removeLayer(layer);
        }
      });
      
      let tileLayer;
      if (newType === 'satellite') {
        tileLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 19,
        });
      } else {
        tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        });
      }
      tileLayer.addTo(googleMapRef.current);
    }
  };

  const locationToUse = selectedLocation || currentLocation;
  const effectiveLocation = mapLocation || selectedLocation || currentLocation;

  useEffect(() => {
    if (googleMapRef.current && effectiveLocation && window.L) {
      googleMapRef.current.setView([effectiveLocation.latitude, effectiveLocation.longitude], 18);
    }
  }, [mapLocation]);

  // Animated typing effect for Expert button
  useEffect(() => {
    if (!visible) return;
    
    const fullText = expertSentences[currentSentence];
    
    if (isTyping && expertText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setExpertText(fullText.slice(0, expertText.length + 1));
      }, 50);
      return () => clearTimeout(timeout);
    } else if (expertText.length === fullText.length) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
        setTimeout(() => {
          setExpertText('');
          setCurrentSentence((prev) => (prev + 1) % expertSentences.length);
          setIsTyping(true);
        }, 2000);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [expertText, isTyping, currentSentence, visible, expertSentences]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#F4C430" />
        <View style={styles.container}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F4C430" />
              <Text style={styles.loadingText}>{t('map.loading')}</Text>
            </View>
          ) : locationToUse ? (
            <View
              ref={mapContainerRef}
              key="map-container"
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                backgroundColor: '#E5E5E5',
                position: 'relative',
                zIndex: 1,
              }}
              onError={(e) => {
                console.error('Map container error:', e);
              }}
            />
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t('map.error')}</Text>
            </View>
          )}

          {showCompass && locationToUse && (
            <View style={styles.compassOverlay}>
              <CompassView
                mode={mode}
                compassType={effectiveCompassType}
                capturedImage={null}
                onClearImage={() => {}}
                onHeadingChange={setHeading}
                hideCalibration={true}
              />
            </View>
          )}

          <View style={styles.topBarContainer}>
            <CompassTopBar
              onMenuPress={() => setSidebarVisible(true)}
              onSearchPress={() => setShowLocationSearch(!showLocationSearch)}
              onBackPress={onClose}
            />
          </View>
          
          {/* CORNER SELECTION BANNER */}
          {cornerSelectionMode && showCornerBanner && (
            <View style={styles.bannerContainer}>
              <View style={styles.cornerBanner} data-testid="corner-banner">
                <View style={styles.cornerIconContainer}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <defs>
                      <filter id="cornerGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    <rect x="6" y="6" width="20" height="20" rx="2" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.15)" opacity="0.9"/>
                    
                    <circle cx="6" cy="6" r="3.5" fill="white" filter="url(#cornerGlow)">
                      <animate attributeName="r" values="3.5;4.2;3.5" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="26" cy="6" r="3.5" fill="white" filter="url(#cornerGlow)">
                      <animate attributeName="r" values="3.5;4.2;3.5" dur="2s" begin="0.5s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="26" cy="26" r="3.5" fill="white" filter="url(#cornerGlow)">
                      <animate attributeName="r" values="3.5;4.2;3.5" dur="2s" begin="1s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="6" cy="26" r="3.5" fill="white" filter="url(#cornerGlow)">
                      <animate attributeName="r" values="3.5;4.2;3.5" dur="2s" begin="1.5s" repeatCount="indefinite"/>
                    </circle>
                    
                    <path d="M10 16h12M16 10v12" stroke="white" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.4"/>
                    
                    <path d="M16 12l-2-2 2-2M16 20l-2 2 2 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
                  </svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cornerBannerTitle}>{t('map.cornerSelection.title')}</Text>
                  <Text style={styles.cornerBannerSubtitle}>{t('map.cornerSelection.subtitle')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.cornerCloseButton}
                  onPress={() => {
                    console.log('❌ Hiding instruction banner only');
                    setShowCornerBanner(false);
                    // Mark as shown in sessionStorage so it doesn't show again this session
                    if (typeof window !== 'undefined' && window.sessionStorage) {
                      window.sessionStorage.setItem('mapViewCornerBannerShown', 'true');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* GRID ACTIVE BANNER */}
          {showVastuGrid && showGridBanner && (
            <View style={styles.bannerContainer}>
              <View style={styles.gridBanner} data-testid="grid-banner">
                <View style={styles.gridIconContainer}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <defs>
                      <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <stop offset="100%" stopColor="#E3F2FD" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="brahmaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                        <stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
                        <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    
                    <rect x="4" y="4" width="24" height="24" rx="2" fill="url(#gridGrad)" stroke="white" strokeWidth="1.5"/>
                    
                    <path d="M4 12h24M4 20h24M12 4v24M20 4v24" stroke="#2196F3" strokeWidth="2" opacity="0.8"/>
                    
                    <rect x="12" y="12" width="8" height="8" fill="url(#brahmaGrad)" rx="1">
                      <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite"/>
                    </rect>
                    
                    <circle cx="16" cy="16" r="2" fill="white" opacity="0.9">
                      <animate attributeName="r" values="2;2.5;2" dur="2s" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gridBannerTitle}>{t('map.gridActive.title')}</Text>
                  <Text style={styles.gridBannerSubtitle}>{t('map.gridActive.subtitle')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.gridCloseButton}
                  onPress={() => {
                    console.log('✓ Dismissing grid info banner only');
                    setShowGridBanner(false);
                    // Mark as shown in sessionStorage so it doesn't show again this session
                    if (typeof window !== 'undefined' && window.sessionStorage) {
                      window.sessionStorage.setItem('mapViewGridBannerShown', 'true');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showLocationSearch && (
            <View style={styles.locationSearchOverlay}>
              <TouchableOpacity
                style={styles.locationSearchOverlayBackdrop}
                activeOpacity={1}
                onPress={() => setShowLocationSearch(false)}
              />
              <View style={styles.locationSearchContainer}>
                <LocationSearch
                  onLocationSelect={(location) => {
                    setMapLocation(location);
                    setShowLocationSearch(false);
                  }}
                />
                {/* Geo Coordinates in Search Area */}
                {locationToUse && (
                  <View style={styles.searchCoordinatesContainer}>
                    <Text style={styles.searchCoordinatesLabel}>{t('map.geoCoordinate')}</Text>
                    <Text style={styles.searchCoordinatesValue}>
                      {locationToUse.latitude.toFixed(7)}, {locationToUse.longitude.toFixed(7)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Right Side Controls */}
          <View style={styles.mapControls}>
            {/* Talk to Expert Button - Animated */}
            <View style={styles.expertButtonContainer}>
              <TouchableOpacity
                style={[styles.expertButton, pressedButton === 'expert' && styles.expertButtonPressed]}
                onPress={async () => {
                  try {
                    const phoneNumber = '7259926494';
                    let url;
                    
                    if (Platform.OS === 'web') {
                      // For web, use WhatsApp Web
                      url = `https://wa.me/${phoneNumber}`;
                    } else {
                      // For mobile, try WhatsApp app first, fallback to web
                      url = `whatsapp://send?phone=${phoneNumber}`;
                    }
                    
                    const canOpen = await Linking.canOpenURL(url);
                    if (canOpen) {
                      await Linking.openURL(url);
                    } else {
                      // Fallback to WhatsApp Web if app is not available
                      const webUrl = `https://wa.me/${phoneNumber}`;
                      const canOpenWeb = await Linking.canOpenURL(webUrl);
                      if (canOpenWeb) {
                        await Linking.openURL(webUrl);
                      } else {
                        alert('Unable to open WhatsApp. Please install WhatsApp or check your internet connection.');
                      }
                    }
                  } catch (error) {
                    console.log('Error opening WhatsApp:', error);
                    // Fallback to WhatsApp Web
                    try {
                      await Linking.openURL(`https://wa.me/7259926494`);
                    } catch (fallbackError) {
                      alert('Unable to open WhatsApp. Please try again later.');
                    }
                  }
                }}
                onPressIn={() => setPressedButton('expert')}
                onPressOut={() => setPressedButton(null)}
                activeOpacity={0.9}
              >
                <View style={styles.expertButtonContent}>
                  <ChatIcon 
                    size={getResponsiveSize(20)} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.expertButtonTitle}>
                    {t('map.talkToExpert') || 'Talk to an Expert'}
                  </Text>
                  <Text style={styles.expertButtonArrow}>→</Text>
                </View>
                <View style={styles.expertButtonSubtext}>
                  <Text style={styles.expertButtonSubtextText}>
                    {expertText}
                    <Text style={styles.expertButtonCursor}>|</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Navbar - Compact horizontal layout */}
          <View style={styles.bottomNavbar}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={Platform.OS !== 'web'}
              contentContainerStyle={styles.navbarContent}
              style={styles.navbarScrollView}
              {...(Platform.OS === 'web' && {
                onWheel: (e) => {
                  // Enable horizontal scrolling with mouse wheel
                  if (e.deltaY !== 0 && e.currentTarget) {
                    e.currentTarget.scrollLeft += e.deltaY;
                    e.preventDefault();
                  }
                }
              })}
            >
              {/* Compass Toggle - First Item */}
              <TouchableOpacity
                style={[styles.navbarItem, showCompass && styles.navbarItemActive]}
                onPress={() => setShowCompass(!showCompass)}
                onPressIn={() => setPressedButton('compass')}
                onPressOut={() => setPressedButton(null)}
                activeOpacity={0.7}
              >
                <View style={styles.navbarIconContainer}>
                  <CompassToggleIcon 
                    size={getResponsiveSize(22)} 
                    color={showCompass ? colors.onPrimary : colors.primary} 
                  />
                </View>
                <Text style={[styles.navbarLabel, showCompass && styles.navbarLabelActive]}>
                  {t('map.compassToggle') || 'Compass'}
                </Text>
              </TouchableOpacity>

              {/* Map Type Toggle */}
              <TouchableOpacity
                style={styles.navbarItem}
                onPress={changeMapType}
                onPressIn={() => setPressedButton('maptype')}
                onPressOut={() => setPressedButton(null)}
                activeOpacity={0.7}
              >
                <View style={styles.navbarIconContainer}>
                  <Text style={styles.navbarIconText}>
                    {mapType === 'satellite' ? '🗺️' : '🛰️'}
                  </Text>
                </View>
                <Text style={styles.navbarLabel}>
                  {mapType === 'satellite' ? (t('map.mapType') || 'Map') : (t('map.satellite') || 'Satellite')}
                </Text>
              </TouchableOpacity>

              {/* Vastu Grid Button */}
              {!showVastuGrid && (
                <TouchableOpacity
                  style={[styles.navbarItem, cornerSelectionMode && styles.navbarItemActive]}
                  onPress={() => {
                    console.log('🔄 Toggle corner mode');
                    setCornerSelectionMode(!cornerSelectionMode);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navbarIconText, !cornerSelectionMode && styles.omSymbolText]}>
                    {cornerSelectionMode ? '📍' : 'ॐ'}
                  </Text>
                  <Text style={[styles.navbarLabel, cornerSelectionMode && styles.navbarLabelActive]}>
                    {cornerSelectionMode ? (t('map.selectCorners') || 'Select Corners') : (t('map.vastuGrid') || 'Vastu Grid')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Apply Button */}
              {cornerSelectionMode && plotCorners.length === 4 && (
                <TouchableOpacity
                  style={[styles.navbarItem, styles.navbarItemApply]}
                  onPress={() => {
                    console.log('✅ Apply button clicked');
                    setCornerSelectionMode(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navbarIconText}>✓</Text>
                  <Text style={styles.navbarLabel}>
                    {t('map.applyGrid') || 'Apply Grid'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Clear Grid Button */}
              {showVastuGrid && (
                <TouchableOpacity
                  style={styles.navbarItem}
                  onPress={() => {
                    console.log('🗑️ Clearing grid');
                    gridLayersRef.current.forEach(l => {
                      try {
                        if (l && googleMapRef.current) {
                          googleMapRef.current.removeLayer(l);
                        }
                      } catch (e) {
                        console.log('⚠️ Error removing layer:', e);
                      }
                    });
                    if (googleMapRef.current && window.L) {
                      googleMapRef.current.eachLayer((layer) => {
                        if (layer instanceof window.L.Polyline || layer instanceof window.L.Polygon) {
                          try {
                            const options = layer.options;
                            if (options && (
                              options.color === '#FFD700' || 
                              options.color === '#F4C430' ||
                              options.fillColor === '#FFA500' ||
                              options.fillColor === 'rgba(255, 165, 0, 0.35)'
                            )) {
                              googleMapRef.current.removeLayer(layer);
                            }
                          } catch (e) {}
                        }
                      });
                    }
                    gridLayersRef.current = [];
                    setPlotCorners([]);
                    setShowVastuGrid(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navbarIconText}>🗑️</Text>
                  <Text style={styles.navbarLabel}>
                    {t('map.clearGrid') || 'Clear Grid'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Layer Toggles - Show when grid is active */}
              {showVastuGrid && (
                <>
                  <View style={styles.navbarDivider} />
                  
                  <TouchableOpacity
                    style={[styles.navbarItem, styles.navbarItemSmall, showOuterLayer && styles.navbarItemActive]}
                    onPress={() => setShowOuterLayer(!showOuterLayer)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.navbarIconContainer}>
                      <Text style={[styles.navbarIconText, styles.navbarIconTextSmall, showOuterLayer && { color: colors.onPrimary }]}>O</Text>
                    </View>
                    <Text style={[styles.navbarLabel, styles.navbarLabelSmall, showOuterLayer && styles.navbarLabelActive]}>
                      {t('map.outerLayer') || 'Outer'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.navbarItem, styles.navbarItemSmall, showMiddleLayer && styles.navbarItemActive]}
                    onPress={() => setShowMiddleLayer(!showMiddleLayer)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.navbarIconContainer}>
                      <Text style={[styles.navbarIconText, styles.navbarIconTextSmall, showMiddleLayer && { color: colors.onPrimary }]}>M</Text>
                    </View>
                    <Text style={[styles.navbarLabel, styles.navbarLabelSmall, showMiddleLayer && styles.navbarLabelActive]}>
                      {t('map.middleLayer') || 'Middle'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.navbarItem, styles.navbarItemSmall, showCenterLayer && styles.navbarItemActive]}
                    onPress={() => setShowCenterLayer(!showCenterLayer)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.navbarIconContainer}>
                      <Text style={[styles.navbarIconText, styles.navbarIconTextSmall, showCenterLayer && { color: colors.onPrimary }]}>C</Text>
                    </View>
                    <Text style={[styles.navbarLabel, styles.navbarLabelSmall, showCenterLayer && styles.navbarLabelActive]}>
                      {t('map.centerLayer') || 'Center'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Action Buttons */}
              <View style={styles.navbarDivider} />

              <TouchableOpacity
                style={styles.navbarItem}
                onPress={async () => {
                  try {
                    const html2canvas = (await import('html2canvas')).default;
                    const containerElement = document.querySelector('.leaflet-container')?.parentElement?.parentElement || document.body;
                    const canvas = await html2canvas(containerElement, {
                      useCORS: true,
                      allowTaint: true,
                      backgroundColor: '#000000',
                    });
                    canvas.toBlob((blob) => {
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                      const filename = showCompass 
                        ? `map-with-compass-${timestamp}.png`
                        : `map-${timestamp}.png`;
                      link.href = url;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    });
                  } catch (error) {
                    console.error('Error downloading map:', error);
                    alert('Failed to download map. Please try again.');
                  }
                }}
                onPressIn={() => setPressedButton('download')}
                onPressOut={() => setPressedButton(null)}
                activeOpacity={0.7}
              >
                <View style={styles.navbarIconContainer}>
                  <DownloadIcon 
                    size={getResponsiveSize(22)} 
                    color={colors.primary} 
                  />
                </View>
                <Text style={styles.navbarLabel}>
                  {t('map.download') || 'Download'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navbarItem}
                onPress={() => {
                  if (googleMapRef.current && currentLocation) {
                    googleMapRef.current.setView([currentLocation.latitude, currentLocation.longitude], 18);
                    setMapLocation(null);
                  }
                }}
                onPressIn={() => setPressedButton('recenter')}
                onPressOut={() => setPressedButton(null)}
                activeOpacity={0.7}
              >
                <View style={styles.navbarIconContainer}>
                  <RecenterIcon 
                    size={getResponsiveSize(22)} 
                    color={colors.primary} 
                  />
                </View>
                <Text style={styles.navbarLabel}>
                  {t('map.recenter') || 'Recenter'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navbarItem, isMapLocked && styles.navbarItemActive]}
                onPress={() => {
                  setIsMapLocked(!isMapLocked);
                  if (googleMapRef.current && window.L) {
                    if (!isMapLocked) {
                      googleMapRef.current.dragging.disable();
                      googleMapRef.current.touchZoom.disable();
                      googleMapRef.current.doubleClickZoom.disable();
                      googleMapRef.current.scrollWheelZoom.disable();
                    } else {
                      googleMapRef.current.dragging.enable();
                      googleMapRef.current.touchZoom.enable();
                      googleMapRef.current.doubleClickZoom.enable();
                      googleMapRef.current.scrollWheelZoom.enable();
                    }
                  }
                }}
                onPressIn={() => setPressedButton('lock')}
                onPressOut={() => setPressedButton(null)}
                activeOpacity={0.7}
              >
                <View style={styles.navbarIconContainer}>
                  <LockIcon 
                    size={getResponsiveSize(22)} 
                    color={isMapLocked ? colors.onPrimary : colors.primary} 
                    locked={isMapLocked} 
                  />
                </View>
                <Text style={[styles.navbarLabel, isMapLocked && styles.navbarLabelActive]}>
                  {isMapLocked ? (t('map.unlock') || 'Unlock') : (t('map.lock') || 'Lock')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navbarItem, !mapLocation && styles.navbarItemDisabled]}
                onPress={() => {
                  if (googleMapRef.current && mapLocation) {
                    googleMapRef.current.setView([mapLocation.latitude, mapLocation.longitude], 18);
                  }
                }}
                onPressIn={() => setPressedButton('pin')}
                onPressOut={() => setPressedButton(null)}
                activeOpacity={0.7}
                disabled={!mapLocation}
              >
                <View style={styles.navbarIconContainer}>
                  <PinIcon 
                    size={getResponsiveSize(22)} 
                    color={mapLocation ? colors.primary : colors.onSurfaceVariant} 
                  />
                </View>
                <Text style={[styles.navbarLabel, !mapLocation && styles.navbarLabelDisabled]}>
                  {t('map.goToLocation') || 'Go to Location'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Toast Message for Pada Information */}
          {selectedPada && (
            <View style={styles.toastContainer}>
              <View style={styles.toastContent}>
                <ScrollView 
                  style={styles.toastScrollView}
                  showsVerticalScrollIndicator={true}
                >
                  <View style={styles.toastHeader}>
                    <Text style={styles.toastTitle}>{selectedPada.name}</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedPada(null)}
                      style={styles.toastCloseButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.toastCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.toastBody}>
                    {selectedPada.zone && (
                      <Text style={styles.toastLabel}>Zone: <Text style={styles.toastValue}>{selectedPada.zone}</Text></Text>
                    )}
                    <Text style={styles.toastLabel}>Energy: <Text style={styles.toastValue}>{selectedPada.energy}</Text></Text>
                    <Text style={styles.toastDescription}>{selectedPada.description}</Text>
                  </View>
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onShowHowToUse={() => setShowHowToUse(true)}
        compassType={effectiveCompassType}
        onCompassTypeChange={(type) => {
          if (onCompassTypeChange) {
            onCompassTypeChange(type);
          }
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4C430',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: getResponsiveSize(16),
    fontSize: getResponsiveFont(16),
    color: '#8B7355',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: getResponsiveFont(16),
    color: '#8B7355',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  compassOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -getResponsiveSize(150) },
      { translateY: -getResponsiveSize(150) }
    ],
    width: getResponsiveSize(300),
    height: getResponsiveSize(300),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 500,
    pointerEvents: 'none',
    opacity: 0.6,
  },
  topBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  mapControls: {
    position: 'absolute',
    top: getResponsiveSize(90),
    right: getResponsiveSize(15),
    flexDirection: 'column',
    gap: getResponsiveSize(12),
    zIndex: 1001,
  },
  buttonWithLabel: {
    alignItems: 'center',
    gap: getResponsiveSize(3),
  },
  mapControlButton: {
    width: getResponsiveSize(38),
    height: getResponsiveSize(38),
    borderRadius: getResponsiveSize(21),
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(244, 196, 48, 0.3)',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    }),
  },
  expertButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertButton: {
    minWidth: getResponsiveSize(190),
    height: getResponsiveSize(58),
    paddingVertical: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(16),
    borderRadius: getResponsiveSize(12),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveSize(4),
    ...(Platform.OS === 'web' && {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    }),
  },
  expertButtonPressed: {
    ...(Platform.OS === 'web' && {
      transform: 'scale(1.05)',
    }),
  },
  expertButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveSize(8),
  },
  expertButtonTitle: {
    fontSize: getResponsiveFont(15),
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    ...(Platform.OS === 'web' && {
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    }),
  },
  expertButtonArrow: {
    fontSize: getResponsiveFont(16),
    color: '#FFFFFF',
    ...(Platform.OS === 'web' && {
      transition: 'transform 0.3s ease',
    }),
  },
  expertButtonSubtext: {
    height: getResponsiveSize(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  expertButtonSubtextText: {
    fontSize: getResponsiveFont(11),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    textAlign: 'center',
  },
  expertButtonCursor: {
    fontSize: getResponsiveFont(11),
    color: 'rgba(255, 255, 255, 0.9)',
    ...(Platform.OS === 'web' && {
      animation: 'blink 1s infinite',
    }),
  },
  mapControlButtonActive: {
    backgroundColor: '#FFD54F',
    borderColor: '#F4C430',
    borderWidth: 3,
    elevation: 8,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 12px rgba(244, 196, 48, 0.4)',
    }),
  },
  buttonLabel: {
    fontSize: getResponsiveFont(9),
    color: '#212121',
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    maxWidth: getResponsiveSize(65),
    backgroundColor: '#FFFFFF',
    paddingVertical: getResponsiveSize(2),
    paddingHorizontal: getResponsiveSize(4),
    borderRadius: getResponsiveSize(8),
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
    ...(Platform.OS === 'web' && {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    }),
    ...(Platform.OS !== 'web' && {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  bottomControlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 2,
    borderTopColor: '#F4C430',
    paddingVertical: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(16),
    zIndex: 1001,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
    }),
  },
  bottomInfoSection: {
    marginBottom: getResponsiveSize(12),
    paddingBottom: getResponsiveSize(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244, 196, 48, 0.2)',
  },
  bottomNavbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primaryContainer, // Light amber background
    borderTopWidth: 3,
    borderTopColor: colors.primary, // Material Amber 600
    paddingTop: getResponsiveSize(4),
    paddingBottom: getResponsiveSize(3),
    paddingHorizontal: 0, // Remove horizontal padding to allow full-width scrolling
    zIndex: 1001,
    overflow: 'hidden', // Hide overflow on container
    ...(Platform.OS === 'web' && {
      boxShadow: '0 -4px 16px rgba(255, 179, 0, 0.25), 0 -2px 8px rgba(0, 0, 0, 0.1)',
      background: `linear-gradient(to top, ${colors.primaryContainer} 0%, rgba(255, 248, 225, 0.95) 100%)`,
    }),
  },
  navbarContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: getResponsiveSize(6),
    width: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    paddingHorizontal: getResponsiveSize(12),
    paddingTop: getResponsiveSize(2),
    paddingBottom: getResponsiveSize(2),
    ...(Platform.OS === 'web' && {
      scrollbarWidth: 'thin',
      scrollbarColor: `${colors.primary} transparent`,
      WebkitOverflowScrolling: 'touch',
      scrollBehavior: 'smooth',
      // Enable horizontal scrolling
      display: 'flex',
      flexDirection: 'row',
      // Ensure scrolling works
      WebkitScrollbar: {
        height: '6px',
      },
      '&::-webkit-scrollbar': {
        height: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: colors.primary,
        borderRadius: '3px',
      },
    }),
  },
  navbarItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(5),
    paddingHorizontal: getResponsiveSize(8),
    borderRadius: getResponsiveSize(12),
    minWidth: getResponsiveSize(60),
    flexShrink: 0,
    gap: getResponsiveSize(4),
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.outline,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
    }),
    ...(Platform.OS !== 'web' && {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  navbarItemActive: {
    backgroundColor: colors.primary, // Material Amber 600
    borderColor: colors.primaryDark, // Material Amber 700
    borderWidth: 2.5,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 6px 16px rgba(255, 179, 0, 0.35), 0 2px 6px rgba(255, 143, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      transform: 'translateY(-2px) scale(1.02)',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
    }),
    ...(Platform.OS !== 'web' && {
      elevation: 6,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
    }),
  },
  navbarItemApply: {
    backgroundColor: colors.success, // Material Green 700
    borderColor: '#2E7D32',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 12px rgba(56, 142, 60, 0.4)',
    }),
  },
  navbarItemSmall: {
    minWidth: getResponsiveSize(45),
    paddingHorizontal: getResponsiveSize(6),
  },
  navbarItemExpert: {
    minWidth: getResponsiveSize(135), // Equivalent to 3 small buttons (45 * 3)
    paddingHorizontal: getResponsiveSize(12),
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: getResponsiveSize(8),
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
    }),
    ...(Platform.OS !== 'web' && {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  navbarItemDisabled: {
    opacity: 0.4,
  },
  navbarIconText: {
    fontSize: getResponsiveFont(18),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    ...(Platform.OS === 'web' && {
      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
      transition: 'transform 0.2s ease',
    }),
  },
  navbarIconTextSmall: {
    fontSize: getResponsiveFont(16),
  },
  navbarLabel: {
    fontSize: getResponsiveFont(9),
    color: colors.onSurface,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    marginTop: getResponsiveSize(2),
    ...(Platform.OS === 'web' && {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: getResponsiveSize(65),
      transition: 'color 0.2s ease',
    }),
  },
  navbarLabelActive: {
    color: colors.onPrimary, // White text on primary
    fontWeight: '700',
  },
  navbarLabelSmall: {
    fontSize: getResponsiveFont(8),
  },
  navbarLabelDisabled: {
    color: '#999999',
  },
  navbarDivider: {
    width: 1.5,
    height: getResponsiveSize(40),
    backgroundColor: colors.outline,
    marginHorizontal: getResponsiveSize(6),
    borderRadius: getResponsiveSize(0.75),
    ...(Platform.OS === 'web' && {
      opacity: 0.5,
    }),
  },
  toastContainer: {
    position: 'absolute',
    bottom: getResponsiveSize(80), // Increased gap above bottom navbar
    left: getResponsiveSize(12),
    right: getResponsiveSize(12),
    zIndex: 1000,
    maxHeight: getResponsiveSize(140),
  },
  toastContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(12),
    borderWidth: 1,
    borderColor: '#E9E2D6',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    maxHeight: getResponsiveSize(140),
    overflow: 'hidden',
    flexDirection: 'column',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
    }),
  },
  toastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(12),
    paddingTop: getResponsiveSize(8),
    paddingBottom: getResponsiveSize(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E9E2D6',
  },
  toastTitle: {
    fontSize: getResponsiveFont(16),
    fontWeight: '700',
    color: '#1F2328',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  toastCloseButton: {
    width: getResponsiveSize(28),
    height: getResponsiveSize(28),
    borderRadius: getResponsiveSize(14),
    backgroundColor: '#FAFAF7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E2D6',
  },
  toastCloseText: {
    fontSize: getResponsiveFont(16),
    color: '#6B7280',
    fontWeight: '600',
  },
  toastScrollView: {
    maxHeight: getResponsiveSize(110),
    flexShrink: 1,
  },
  toastBody: {
    padding: getResponsiveSize(16),
  },
  toastLabel: {
    fontSize: getResponsiveFont(13),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: getResponsiveSize(8),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  toastValue: {
    fontWeight: '400',
    color: '#1F2328',
  },
  toastDescription: {
    fontSize: getResponsiveFont(13),
    fontWeight: '400',
    color: '#1F2328',
    lineHeight: getResponsiveFont(20),
    marginTop: getResponsiveSize(8),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  navbarIconContainer: {
    width: getResponsiveSize(28),
    height: getResponsiveSize(28),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getResponsiveSize(6),
    ...(Platform.OS === 'web' && {
      display: 'flex',
      flexShrink: 0,
      transition: 'all 0.2s ease',
    }),
  },
  compassIconContainer: {
    width: getResponsiveSize(26),
    height: getResponsiveSize(26),
    ...(Platform.OS === 'web' && {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
  },
  omSymbolText: {
    color: colors.primary,
    fontSize: getResponsiveFont(20),
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  locationSearchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
  },
  locationSearchOverlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  locationSearchContainer: {
    position: 'absolute',
    top: getResponsiveSize(90),
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingTop: getResponsiveSize(10),
    paddingBottom: getResponsiveSize(20),
    maxHeight: '80%',
  },
  searchCoordinatesContainer: {
    paddingHorizontal: getResponsiveSize(16),
    paddingVertical: getResponsiveSize(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(244, 196, 48, 0.2)',
    backgroundColor: 'rgba(244, 196, 48, 0.05)',
  },
  searchCoordinatesLabel: {
    fontSize: getResponsiveFont(10),
    color: '#F4C430',
    fontWeight: '700',
    marginBottom: getResponsiveSize(4),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchCoordinatesValue: {
    fontSize: getResponsiveFont(12),
    color: '#212121',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    ...(Platform.OS === 'web' && {
      fontFeatureSettings: '"tnum"',
    }),
  },
  controlDivider: {
    width: 1,
    height: getResponsiveSize(40),
    backgroundColor: 'rgba(244, 196, 48, 0.3)',
    marginHorizontal: getResponsiveSize(4),
  },
  infoBox: {
    gap: getResponsiveSize(4), // Increased from 2 to 4
  },
  infoLabel: {
    fontSize: getResponsiveFont(11), // Increased from 10 to 11
    color: '#F4C430',
    fontWeight: '800',
    marginBottom: getResponsiveSize(6), // Increased from 4 to 6
    letterSpacing: 0.5,
    paddingVertical: getResponsiveSize(2), // Added padding
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    ...(Platform.OS === 'web' && {
      textShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)', // Add text shadow for better visibility
    }),
  },
  infoValue: {
    fontSize: getResponsiveFont(11), // Increased from 10 to 11
    color: '#212121', // Changed from #424242 to #212121 for better contrast
    fontWeight: '600',
    paddingVertical: getResponsiveSize(2), // Added padding
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
    ...(Platform.OS === 'web' && {
      textShadow: '0px 1px 2px rgba(255, 255, 255, 0.8)', // Add text shadow for better visibility
    }),
  },
  applyButtonText: {
    fontSize: getResponsiveFont(20),
    color: '#FFFFFF',
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  bannerContainer: {
    position: 'absolute',
    top: getResponsiveSize(145),
    left: getResponsiveSize(15),
    right: getResponsiveSize(145),
    zIndex: 999,
    pointerEvents: 'box-none',
  },
  cornerBanner: {
    backgroundColor: '#FF5722',
    borderRadius: getResponsiveSize(14),
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(12),
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(10),
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 15,
    overflow: 'visible',
    minHeight: getResponsiveSize(50),
    borderLeftWidth: 4,
    borderLeftColor: '#FFFFFF',
  },
  cornerIconContainer: {
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerBannerTitle: {
    fontSize: getResponsiveFont(14),
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  cornerBannerText: {
    fontSize: getResponsiveFont(11),
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  cornerBannerSubtitle: {
    fontSize: getResponsiveFont(11),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginTop: getResponsiveSize(2),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  cornerCloseButton: {
    width: getResponsiveSize(30),
    height: getResponsiveSize(30),
    borderRadius: getResponsiveSize(15),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFont(20),
    fontWeight: '700',
    lineHeight: getResponsiveFont(20),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  gridBanner: {
    backgroundColor: '#2196F3',
    borderRadius: getResponsiveSize(14),
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(12),
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(10),
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 15,
    overflow: 'visible',
    minHeight: getResponsiveSize(50),
    borderLeftWidth: 4,
    borderLeftColor: '#FFFFFF',
  },
  gridIconContainer: {
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridBannerTitle: {
    fontSize: getResponsiveFont(14),
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  gridCloseButton: {
    width: getResponsiveSize(30),
    height: getResponsiveSize(30),
    borderRadius: getResponsiveSize(15),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  gridBannerSubtitle: {
    fontSize: getResponsiveFont(11),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginTop: getResponsiveSize(2),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  layerDivider: {
    height: 1,
    backgroundColor: 'rgba(244, 196, 48, 0.4)',
    marginVertical: getResponsiveSize(10),
    width: getResponsiveSize(48),
    borderRadius: getResponsiveSize(0.5),
  },
  layerButton: {
    width: getResponsiveSize(48),
    height: getResponsiveSize(48),
    borderRadius: getResponsiveSize(24),
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(244, 196, 48, 0.3)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  layerButtonActive: {
    backgroundColor: '#FFD54F',
    borderColor: '#F4C430',
    borderWidth: 3,
    elevation: 6,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  layerButtonText: {
    fontSize: getResponsiveFont(16),
    fontWeight: '900',
    color: '#2C2C2C',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
});
