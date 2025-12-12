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
} from 'react-native';
import CompassView from './CompassView';
import CompassTopBar from './CompassTopBar';
import LocationSearch from './LocationSearch';
import { useI18n, translateDevta as translateDevtaName } from '../utils/i18n';
import { 
  DownloadIcon, 
  RecenterIcon, 
  LockIcon, 
  PinIcon, 
  CompassToggleIcon, 
  MapLayerIcon 
} from './svgs';
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

export default function MapViewModal({ visible, onClose, mode, compassType, selectedLocation }) {
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
            <div style="position: relative; width: 60px; height: 60px; cursor: grab; padding: 8px; display: flex; align-items: center; justify-content: center;">
              <svg width="44" height="44" viewBox="0 0 44 44">
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
                
                <!-- Main circle with gradient and light white glow border -->
                <circle cx="22" cy="22" r="20" fill="url(#grad${i})" 
                  stroke="rgba(255,255,255,0.6)" 
                  stroke-width="2" 
                  filter="url(#lightGlow${i})"
                  style="filter: drop-shadow(0 0 3px rgba(255,255,255,0.4));"/>
                
                <!-- Number -->
                <text x="22" y="28" text-anchor="middle" fill="white" 
                  font-size="20" font-weight="900" font-family="Arial, sans-serif">${i + 1}</text>
              </svg>
            </div>
          `,
          iconSize: [60, 60],
          iconAnchor: [30, 30],
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
            background: linear-gradient(135deg, #FF3333 0%, #E60000 100%);
            color: white;
            padding: 6px 10px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 13px;
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(255,0,0,0.4);
            text-align: center;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          ">
            ${getArrowSVG(corner.direction)}
            <span style="font-family: 'DM Sans', sans-serif;">${corner.name}</span>
          </div>
        `, {
          permanent: true,
          direction: 'top',
          offset: [0, -28],
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
            <div
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
              />
            </View>
          )}

          <View style={styles.topBarContainer}>
            <CompassTopBar
              onMenuPress={() => {}}
              onSearchPress={() => setShowLocationSearch(!showLocationSearch)}
              onBackPress={onClose}
            />
            
            <View style={styles.mapControls}>
              <TouchableOpacity
                style={[styles.mapControlButton, showCompass && styles.mapControlButtonActive]}
                onPress={() => setShowCompass(!showCompass)}
                onPressIn={() => setPressedButton('compass')}
                onPressOut={() => setPressedButton(null)}
                activeOpacity={0.6}
              >
                <CompassToggleIcon 
                  size={getResponsiveSize(24)} 
                  color={pressedButton === 'compass' ? "#5D4037" : "#F4C430"} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mapControlButton}
                onPress={changeMapType}
                onPressIn={() => setPressedButton('maptype')}
                onPressOut={() => setPressedButton(null)}
                activeOpacity={0.6}
              >
                <Text style={[styles.mapControlButtonText, pressedButton === 'maptype' && { opacity: 0.7 }]}>
                  {mapType === 'satellite' ? '🗺️' : '🛰️'}
                </Text>
              </TouchableOpacity>
              
              {/* VASTU GRID BUTTON */}
              {!showVastuGrid && (
                <TouchableOpacity
                  style={[styles.mapControlButton, cornerSelectionMode && styles.mapControlButtonActive]}
                  onPress={() => {
                    console.log('🔄 Toggle corner mode');
                    setCornerSelectionMode(!cornerSelectionMode);
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.mapControlButtonText, !cornerSelectionMode && styles.omSymbolText]}>
                    {cornerSelectionMode ? '📍' : 'ॐ'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* APPLY BUTTON */}
              {cornerSelectionMode && plotCorners.length === 4 && (
                <TouchableOpacity
                  style={[styles.mapControlButton, styles.applyButton]}
                  onPress={() => {
                    console.log('✅ Apply button clicked');
                    console.log('📍 Plot corners:', plotCorners);
                    console.log('🗺️ Map ref exists:', !!googleMapRef.current);
                    setCornerSelectionMode(false);
                    console.log('🔄 Corner selection mode set to false');
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.applyButtonText}>✓</Text>
                </TouchableOpacity>
              )}
              
              {/* CLEAR BUTTON */}
              {showVastuGrid && (
                <TouchableOpacity
                  style={styles.mapControlButton}
                  onPress={() => {
                    console.log('🗑️ Clearing grid - removing', gridLayersRef.current.length, 'layers');
                    
                    // Remove all tracked grid layers
                    gridLayersRef.current.forEach(l => {
                      try {
                        if (l && googleMapRef.current) {
                          googleMapRef.current.removeLayer(l);
                        }
                      } catch (e) {
                        console.log('⚠️ Error removing layer:', e);
                      }
                    });
                    
                    // Also remove any orphaned layers by checking all map layers
                    if (googleMapRef.current && window.L) {
                      googleMapRef.current.eachLayer((layer) => {
                        // Remove any polylines or polygons that look like grid lines
                        if (layer instanceof window.L.Polyline || layer instanceof window.L.Polygon) {
                          try {
                            // Check if it's a grid-related layer (yellow/golden colors)
                            const options = layer.options;
                            if (options && (
                              options.color === '#FFD700' || 
                              options.color === '#F4C430' ||
                              options.fillColor === '#FFA500' ||
                              options.fillColor === 'rgba(255, 165, 0, 0.35)'
                            )) {
                              googleMapRef.current.removeLayer(layer);
                              console.log('🗑️ Removed orphaned grid layer');
                            }
                          } catch (e) {
                            // Ignore errors for layers that might not have options
                          }
                        }
                      });
                    }
                    
                    gridLayersRef.current = [];
                    setPlotCorners([]);
                    setShowVastuGrid(false);
                    console.log('✅ Grid cleared successfully');
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.mapControlButtonText}>🗑️</Text>
                </TouchableOpacity>
              )}
              
              {/* LAYER TOGGLES - Show when grid is active */}
              {showVastuGrid && (
                <>
                  <View style={styles.layerDivider} />
                  
                  {/* Outer Layer Toggle */}
                  <TouchableOpacity
                    style={[styles.layerButton, showOuterLayer && styles.layerButtonActive]}
                    onPress={() => setShowOuterLayer(!showOuterLayer)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.layerButtonText}>O</Text>
                  </TouchableOpacity>
                  
                  {/* Middle Layer Toggle */}
                  <TouchableOpacity
                    style={[styles.layerButton, showMiddleLayer && styles.layerButtonActive]}
                    onPress={() => setShowMiddleLayer(!showMiddleLayer)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.layerButtonText}>M</Text>
                  </TouchableOpacity>
                  
                  {/* Center Layer Toggle */}
                  <TouchableOpacity
                    style={[styles.layerButton, showCenterLayer && styles.layerButtonActive]}
                    onPress={() => setShowCenterLayer(!showCenterLayer)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.layerButtonText}>C</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
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
              </View>
            </View>
          )}

          {locationToUse && (
            <View style={styles.bottomInfo}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>{t('map.geoCoordinate')}</Text>
                <Text style={styles.infoValue}>
                  {t('map.latitude')}: {locationToUse.latitude.toFixed(7)}
                </Text>
                <Text style={styles.infoValue}>
                  {t('map.longitude')}: {locationToUse.longitude.toFixed(7)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.bottomButton}
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
              activeOpacity={0.6}
            >
              <DownloadIcon 
                size={getResponsiveSize(24)} 
                color={pressedButton === 'download' ? "#5D4037" : "#F4C430"} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => {
                if (googleMapRef.current && currentLocation) {
                  googleMapRef.current.setView([currentLocation.latitude, currentLocation.longitude], 18);
                  setMapLocation(null);
                }
              }}
              onPressIn={() => setPressedButton('recenter')}
              onPressOut={() => setPressedButton(null)}
              activeOpacity={0.6}
            >
              <RecenterIcon 
                size={getResponsiveSize(24)} 
                color={pressedButton === 'recenter' ? "#5D4037" : "#F4C430"} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomButton, isMapLocked && styles.bottomButtonActive]}
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
              activeOpacity={0.6}
            >
              <LockIcon 
                size={getResponsiveSize(24)} 
                color={pressedButton === 'lock' ? "#5D4037" : "#F4C430"} 
                locked={isMapLocked} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => {
                if (googleMapRef.current && mapLocation) {
                  googleMapRef.current.setView([mapLocation.latitude, mapLocation.longitude], 18);
                }
              }}
              onPressIn={() => setPressedButton('pin')}
              onPressOut={() => setPressedButton(null)}
              activeOpacity={0.6}
              disabled={!mapLocation}
            >
              <PinIcon 
                size={getResponsiveSize(24)} 
                color={pressedButton === 'pin' && mapLocation ? "#5D4037" : (mapLocation ? "#F4C430" : "#CCCCCC")} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
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
  mapControlButton: {
    width: getResponsiveSize(48),
    height: getResponsiveSize(48),
    borderRadius: getResponsiveSize(24),
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
  },
  mapControlButtonText: {
    fontSize: getResponsiveFont(22),
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  omSymbolText: {
    color: '#F4C430',
    fontSize: getResponsiveFont(24),
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
  bottomInfo: {
    position: 'absolute',
    bottom: getResponsiveSize(85),
    left: getResponsiveSize(15),
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: getResponsiveSize(12),
    borderWidth: 2,
    borderColor: '#F4C430',
    padding: getResponsiveSize(12),
    elevation: 6,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  infoBox: {
    gap: getResponsiveSize(2),
  },
  infoLabel: {
    fontSize: getResponsiveFont(10),
    color: '#F4C430',
    fontWeight: '800',
    marginBottom: getResponsiveSize(4),
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  infoValue: {
    fontSize: getResponsiveFont(10),
    color: '#424242',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  bottomControls: {
    position: 'absolute',
    bottom: getResponsiveSize(20),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveSize(14),
    paddingHorizontal: getResponsiveSize(15),
    zIndex: 600,
  },
  bottomButton: {
    width: getResponsiveSize(54),
    height: getResponsiveSize(54),
    borderRadius: getResponsiveSize(27),
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
  },
  bottomButtonActive: {
    backgroundColor: '#FFD54F',
    borderColor: '#F4C430',
    borderWidth: 3,
    elevation: 8,
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    width: getResponsiveSize(60),
    height: getResponsiveSize(60),
    borderRadius: getResponsiveSize(30),
    elevation: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  applyButtonText: {
    fontSize: getResponsiveFont(32),
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
