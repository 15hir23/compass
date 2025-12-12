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
import * as Location from 'expo-location';
// Removed mapUtils imports - using simple inline calculations instead
import {
  VASTU_GRID_9X9,
  getBrahmasthanCells,
} from '../utils/vastuGrid';

// Conditional imports for native vs web
let MapView, Marker, Polygon, Polyline;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polygon = maps.Polygon;
  Polyline = maps.Polyline;
}

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

export default function MapViewModal({ visible, onClose, mode, compassType, selectedLocation }) {
  const { t, language } = useI18n();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Use Classic Compass as default fallback if no compass type specified
  const effectiveCompassType = compassType || 'classic';
  const [mapType, setMapType] = useState('satellite');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [mapLocation, setMapLocation] = useState(null);
  const [showCompass, setShowCompass] = useState(true);
  const [isMapLocked, setIsMapLocked] = useState(false);
  const [pressedButton, setPressedButton] = useState(null);
  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  
  // Vastu Grid state
  const [plotCorners, setPlotCorners] = useState([]);
  const [cornerSelectionMode, setCornerSelectionMode] = useState(false);
  const [showVastuGrid, setShowVastuGrid] = useState(false);
  const [showDevtaLabels, setShowDevtaLabels] = useState(true);
  const [highlightBrahmasthan, setHighlightBrahmasthan] = useState(true);
  const gridLayersRef = useRef([]);
  const plotCornersRef = useRef([]);
  const cornerSelectionModeRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const cornerMarkersRef = useRef([]);

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    } else {
      // Clean up map when modal closes
      if (googleMapRef.current) {
        if (Platform.OS === 'web' && window.L) {
          try {
            googleMapRef.current.remove();
            console.log('Map removed successfully');
          } catch (error) {
            console.log('Error removing map:', error);
          }
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
    }
  }, [visible]);

  // Load Leaflet script dynamically on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && !window.L) {
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
    if (visible && Platform.OS === 'web' && !loading && locationToUse && mapContainerRef.current && !googleMapRef.current) {
      // Add small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeLeafletMap();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible, loading, currentLocation, selectedLocation]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      if (Platform.OS === 'web') {
        // Use web geolocation API
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
              // Fallback to default location or selected location
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
      } else {
        // Use expo-location for native
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
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

  // Draw Vastu Grid on map
  const drawVastuGrid = () => {
    if (!googleMapRef.current || plotCorners.length !== 4 || !window.L) return;
    
    // Clear previous grid layers
    gridLayersRef.current.forEach(layer => {
      if (googleMapRef.current) {
        googleMapRef.current.removeLayer(layer);
      }
    });
    gridLayersRef.current = [];
    
    try {
      // Calculate center as average of corners
      const center = {
        latitude: plotCorners.reduce((sum, p) => sum + p.latitude, 0) / 4,
        longitude: plotCorners.reduce((sum, p) => sum + p.longitude, 0) / 4,
      };
      
      // Generate grid lines (simple interpolation)
      const verticalLines = [];
      const horizontalLines = [];
      for (let i = 0; i <= 9; i++) {
        const t = i / 9;
        // Vertical line
        const vLine = [
          {
            x: plotCorners[0].latitude + (plotCorners[1].latitude - plotCorners[0].latitude) * t,
            y: plotCorners[0].longitude + (plotCorners[1].longitude - plotCorners[0].longitude) * t,
          },
          {
            x: plotCorners[3].latitude + (plotCorners[2].latitude - plotCorners[3].latitude) * t,
            y: plotCorners[3].longitude + (plotCorners[2].longitude - plotCorners[3].longitude) * t,
          },
        ];
        verticalLines.push(vLine);
        
        // Horizontal line
        const hLine = [
          {
            x: plotCorners[0].latitude + (plotCorners[3].latitude - plotCorners[0].latitude) * t,
            y: plotCorners[0].longitude + (plotCorners[3].longitude - plotCorners[0].longitude) * t,
          },
          {
            x: plotCorners[1].latitude + (plotCorners[2].latitude - plotCorners[1].latitude) * t,
            y: plotCorners[1].longitude + (plotCorners[2].longitude - plotCorners[1].longitude) * t,
          },
        ];
        horizontalLines.push(hLine);
      }
      
      // Draw plot outline
      const plotLatLngs = plotCorners.map(p => [p.latitude, p.longitude]);
      const plotPolygon = window.L.polygon([...plotLatLngs, plotLatLngs[0]], {
        color: '#F4C430',
        fillColor: 'transparent',
        weight: 3,
        opacity: 0.9,
      }).addTo(googleMapRef.current);
      gridLayersRef.current.push(plotPolygon);
      
      // Draw vertical grid lines
      verticalLines.forEach((line) => {
        const latLngs = [[line[0].x, line[0].y], [line[1].x, line[1].y]];
        const polyline = window.L.polyline(latLngs, {
          color: '#F4C430',
          weight: 1,
          opacity: 0.6,
        }).addTo(googleMapRef.current);
        gridLayersRef.current.push(polyline);
      });
      
      // Draw horizontal grid lines
      horizontalLines.forEach((line) => {
        const latLngs = [[line[0].x, line[0].y], [line[1].x, line[1].y]];
        const polyline = window.L.polyline(latLngs, {
          color: '#F4C430',
          weight: 1,
          opacity: 0.6,
        }).addTo(googleMapRef.current);
        gridLayersRef.current.push(polyline);
      });
      
      // Highlight Brahmasthan (center 9 cells: rows 3-5, cols 3-5)
      if (highlightBrahmasthan) {
        const brahmasthanCells = getBrahmasthanCells();
        brahmasthanCells.forEach(({ row, col }) => {
          // Calculate cell corners using simple interpolation
          const rowStart = row / 9;
          const rowEnd = (row + 1) / 9;
          const colStart = col / 9;
          const colEnd = (col + 1) / 9;
          
          // Calculate 4 corners of the cell
          const blLat = plotCorners[0].latitude + (plotCorners[1].latitude - plotCorners[0].latitude) * colStart + (plotCorners[3].latitude - plotCorners[0].latitude) * rowStart;
          const blLng = plotCorners[0].longitude + (plotCorners[1].longitude - plotCorners[0].longitude) * colStart + (plotCorners[3].longitude - plotCorners[0].longitude) * rowStart;
          
          const brLat = plotCorners[0].latitude + (plotCorners[1].latitude - plotCorners[0].latitude) * colEnd + (plotCorners[3].latitude - plotCorners[0].latitude) * rowStart;
          const brLng = plotCorners[0].longitude + (plotCorners[1].longitude - plotCorners[0].longitude) * colEnd + (plotCorners[3].longitude - plotCorners[0].longitude) * rowStart;
          
          const trLat = plotCorners[0].latitude + (plotCorners[1].latitude - plotCorners[0].latitude) * colEnd + (plotCorners[3].latitude - plotCorners[0].latitude) * rowEnd;
          const trLng = plotCorners[0].longitude + (plotCorners[1].longitude - plotCorners[0].longitude) * colEnd + (plotCorners[3].longitude - plotCorners[0].longitude) * rowEnd;
          
          const tlLat = plotCorners[0].latitude + (plotCorners[1].latitude - plotCorners[0].latitude) * colStart + (plotCorners[3].latitude - plotCorners[0].latitude) * rowEnd;
          const tlLng = plotCorners[0].longitude + (plotCorners[1].longitude - plotCorners[0].longitude) * colStart + (plotCorners[3].longitude - plotCorners[0].longitude) * rowEnd;
          
          const polygon = window.L.polygon([
            [blLat, blLng],
            [brLat, brLng],
            [trLat, trLng],
            [tlLat, tlLng],
          ], {
            color: '#FFA500',
            fillColor: '#FFA500',
            fillOpacity: 0.3,
            weight: 2,
          }).addTo(googleMapRef.current);
          gridLayersRef.current.push(polygon);
        });
      }
      
      // Draw devta labels
      if (showDevtaLabels) {
        const currentLang = language || 'en';
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            const devtaInfo = VASTU_GRID_9X9[row][col];
            const translatedDevtaName = translateDevtaName(devtaInfo.devta, currentLang);
            
            // Calculate cell center using simple interpolation
            const rowCenter = (row + 0.5) / 9;
            const colCenter = (col + 0.5) / 9;
            
            const cellLat = plotCorners[0].latitude + 
              (plotCorners[1].latitude - plotCorners[0].latitude) * colCenter +
              (plotCorners[3].latitude - plotCorners[0].latitude) * rowCenter;
            const cellLng = plotCorners[0].longitude + 
              (plotCorners[1].longitude - plotCorners[0].longitude) * colCenter +
              (plotCorners[3].longitude - plotCorners[0].longitude) * rowCenter;
            
            const devtaIcon = window.L.divIcon({
              className: 'devta-label',
              html: `<div style="
                background: ${devtaInfo.color}DD;
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 9px;
                font-weight: bold;
                font-family: 'DM Sans', sans-serif;
                white-space: nowrap;
                border: 1px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                text-align: center;
              ">${translatedDevtaName}<br/><span style="font-size: 7px; font-family: 'DM Sans', sans-serif;">${devtaInfo.zone}</span></div>`,
              iconSize: [null, null],
              iconAnchor: [0, 0]
            });
            
            const marker = window.L.marker([cellLat, cellLng], {
              icon: devtaIcon
            }).addTo(googleMapRef.current);
            
            // Add tooltip with more info
            marker.bindTooltip(`
              <div style="text-align: center; font-family: 'DM Sans', sans-serif;">
                <strong style="font-family: 'DM Sans', sans-serif;">${translatedDevtaName}</strong><br/>
                Zone: ${devtaInfo.zone}<br/>
                Energy: ${devtaInfo.energy}
              </div>
            `, { direction: 'top' });
            
            gridLayersRef.current.push(marker);
          }
        }
      }
      
      setShowVastuGrid(true);
      console.log('✅ Vastu grid drawn successfully');
    } catch (error) {
      console.error('Error drawing Vastu grid:', error);
    }
  };
  
  // Sync refs with state
  useEffect(() => {
    plotCornersRef.current = plotCorners;
  }, [plotCorners]);

  useEffect(() => {
    cornerSelectionModeRef.current = cornerSelectionMode;
    console.log('📌 Corner selection mode changed to:', cornerSelectionMode);
  }, [cornerSelectionMode]);

  // Auto-place draggable corners - MOBILE (react-native-maps)
  useEffect(() => {
    if (Platform.OS === 'web') {
      return; // Web handled separately below
    }
    
    if (!mapReady || !locationToUse) {
      return;
    }
    
    // Clean up when mode is turned off
    if (!cornerSelectionMode) {
      setPlotCorners([]);
      return;
    }
    
    // Auto-place corners around map center
    setTimeout(() => {
      const center = locationToUse;
      const offset = 0.0008;
      const autoCorners = [
        { latitude: center.latitude - offset, longitude: center.longitude - offset, label: 'BL', name: 'Bottom-Left' },
        { latitude: center.latitude - offset, longitude: center.longitude + offset, label: 'BR', name: 'Bottom-Right' },
        { latitude: center.latitude + offset, longitude: center.longitude + offset, label: 'TR', name: 'Top-Right' },
        { latitude: center.latitude + offset, longitude: center.longitude - offset, label: 'TL', name: 'Top-Left' },
      ];
      
      setPlotCorners(autoCorners);
      console.log('🎉 Mobile corner markers initialized:', autoCorners);
    }, 500);
  }, [mapReady, cornerSelectionMode, locationToUse]);

  // Auto-place draggable corners - WEB (Leaflet)
  useEffect(() => {
    // Only for web platform
    if (Platform.OS !== 'web') {
      return;
    }
    
    console.log('🔍 Auto-placement effect triggered:', {
      mapReady,
      cornerSelectionMode,
      hasWindow: typeof window !== 'undefined',
      hasLeaflet: typeof window !== 'undefined' && !!window.L,
      hasMap: !!googleMapRef.current,
    });
    
    // Wait for all prerequisites
    if (!mapReady || !googleMapRef.current) {
      console.log('⏳ Waiting for map to be ready...');
      return;
    }
    
    if (typeof window === 'undefined' || !window.L) {
      console.log('⏳ Waiting for Leaflet to load...');
      return;
    }
    
    // Clean up when mode is turned off
    if (!cornerSelectionMode) {
      console.log('🧹 Cleaning up corner markers (mode off)');
      cornerMarkersRef.current.forEach(m => {
        if (googleMapRef.current) {
          try {
            googleMapRef.current.removeLayer(m);
          } catch (e) {
            console.log('Cleanup error:', e);
          }
        }
      });
      cornerMarkersRef.current = [];
      return;
    }
    
    // Clear any existing corner markers first
    console.log('🧹 Clearing old markers before placing new ones...');
    cornerMarkersRef.current.forEach(m => {
      if (googleMapRef.current) {
        try {
          googleMapRef.current.removeLayer(m);
        } catch (e) {}
      }
    });
    cornerMarkersRef.current = [];
    
    // Small delay to ensure map is fully rendered
    setTimeout(() => {
      if (!googleMapRef.current || !window.L) {
        console.log('❌ Map or Leaflet not available in setTimeout');
        return;
      }
      
      const map = googleMapRef.current;
      const center = map.getCenter();
      
      console.log('📍 Map center:', center);
      
      // Calculate offset - larger for visibility (about 50-100m)
      const offset = 0.0008; // Increased for better visibility
      
      // Auto-place 4 corners in a square around current center
      const autoCorners = [
        { latitude: center.lat - offset, longitude: center.lng - offset, label: 'BL', name: 'Bottom-Left' },
        { latitude: center.lat - offset, longitude: center.lng + offset, label: 'BR', name: 'Bottom-Right' },
        { latitude: center.lat + offset, longitude: center.lng + offset, label: 'TR', name: 'Top-Right' },
        { latitude: center.lat + offset, longitude: center.lng - offset, label: 'TL', name: 'Top-Left' },
      ];
      
      console.log('🎯 PLACING 4 DRAGGABLE CORNER MARKERS:', autoCorners);
      
      // Create draggable markers for each corner
      autoCorners.forEach((corner, index) => {
        console.log(`Creating marker ${index + 1} at:`, corner);
        
        const cornerIcon = window.L.divIcon({
          className: `corner-marker-${index}`,
          html: `
            <div style="
              width: 50px;
              height: 50px;
              background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%);
              border: 6px solid white;
              border-radius: 50%;
              box-shadow: 0 6px 20px rgba(255,0,0,0.8), 0 0 0 2px #FF0000;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 900;
              font-size: 22px;
              cursor: grab;
              position: relative;
            ">${index + 1}</div>
          `,
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        });
        
        try {
          const marker = window.L.marker([corner.latitude, corner.longitude], {
            icon: cornerIcon,
            draggable: true,
            autoPan: true,
            zIndexOffset: 10000,
            riseOnHover: true,
          }).addTo(map);
          
          console.log(`✅ Marker ${index + 1} ADDED to map`);
          
          // Drag events with visual feedback
          marker.on('dragstart', () => {
            console.log(`🎯 Started dragging corner ${index + 1}`);
            marker.setOpacity(0.7);
          });
          
          marker.on('drag', () => {
            // Update in real-time during drag
            const pos = marker.getLatLng();
            const updatedCorners = [...plotCornersRef.current];
            updatedCorners[index] = {
              latitude: pos.lat,
              longitude: pos.lng
            };
            plotCornersRef.current = updatedCorners;
          });
          
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const updatedCorners = [...plotCornersRef.current];
            updatedCorners[index] = {
              latitude: pos.lat,
              longitude: pos.lng
            };
            setPlotCorners(updatedCorners);
            marker.setOpacity(1.0);
            console.log(`✅ Corner ${index + 1} placed at:`, { lat: pos.lat, lng: pos.lng });
          });
          
          // Permanent tooltip showing corner info
          marker.bindTooltip(`
            <div style="
              background: linear-gradient(135deg, #FF0000, #CC0000);
              color: white;
              padding: 8px 12px;
              border-radius: 8px;
              font-weight: bold;
              font-size: 13px;
              border: 3px solid white;
              text-align: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              <div style="font-size: 14px; margin-bottom: 2px;">Corner ${index + 1}</div>
              <div style="font-size: 11px; opacity: 0.9;">${corner.name}</div>
              <div style="font-size: 10px; margin-top: 4px; opacity: 0.8;">👆 Drag to adjust</div>
            </div>
          `, {
            permanent: true,
            direction: 'top',
            offset: [0, -15],
            className: 'corner-tooltip'
          });
          
          cornerMarkersRef.current.push(marker);
          
        } catch (error) {
          console.error(`❌ Error creating marker ${index + 1}:`, error);
        }
      });
      
      // Initialize corners state
      const initialCorners = autoCorners.map(c => ({ latitude: c.latitude, longitude: c.longitude }));
      setPlotCorners(initialCorners);
      
      console.log('🎉 ALL 4 DRAGGABLE CORNERS PLACED! Total markers:', cornerMarkersRef.current.length);
      
    }, 500); // 500ms delay to ensure map is fully ready
    
  }, [mapReady, cornerSelectionMode]);

  // Effect to draw grid when corners are confirmed (selection mode OFF)
  useEffect(() => {
    if (plotCorners.length === 4 && !cornerSelectionMode) {
      if (Platform.OS === 'web' && googleMapRef.current) {
        console.log('🎨 Drawing Vastu grid (web) with corners:', plotCorners);
      drawVastuGrid();
      } else if (Platform.OS !== 'web') {
        // Mobile: Grid is rendered directly in MapView JSX
        console.log('🎨 Vastu grid ready (mobile) with corners:', plotCorners);
        console.log('📍 Polygon available:', !!Polygon, 'Polyline available:', !!Polyline);
        console.log('📍 showVastuGrid will be set to true');
        setShowVastuGrid(true);
      }
    } else {
      setShowVastuGrid(false);
    }
  }, [plotCorners, showDevtaLabels, highlightBrahmasthan, cornerSelectionMode, language]);

  const initializeLeafletMap = () => {
    let retryCount = 0;
    const maxRetries = 100; // Try for 10 seconds
    
    // Check if Leaflet is loaded
    const checkLeaflet = () => {
      // Log what we're checking
      if (retryCount === 0) {
        console.log('Starting Leaflet initialization check...');
        console.log('window.L exists?', typeof window !== 'undefined' && !!window.L);
        console.log('mapContainerRef.current exists?', !!mapContainerRef.current);
      }
      
      // Check if Leaflet exists and is properly loaded
      if (typeof window !== 'undefined' && window.L && mapContainerRef.current && !googleMapRef.current) {
        try {
          // Clear any existing map content in the container
          if (mapContainerRef.current.innerHTML) {
            mapContainerRef.current.innerHTML = '';
          }
          
          // Create map
          const map = window.L.map(mapContainerRef.current, {
            zoomControl: false, // We'll add custom controls
            tap: true, // Enable tap events
            touchZoom: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            dragging: true,
          }).setView([locationToUse.latitude, locationToUse.longitude], 18);
          
          console.log('✅ Map created, adding event listeners...');
          console.log('Map object:', map);
          console.log('Map container:', mapContainerRef.current);
          
          // Add simple test handler first
          setTimeout(() => {
            console.log('⏰ Setting up click handler after 1 second...');
            console.log('Current cornerSelectionModeRef:', cornerSelectionModeRef.current);
            console.log('Current plotCornersRef:', plotCornersRef.current);
          }, 1000);

          // Add tile layer based on map type
          let tileLayer;
          if (mapType === 'satellite') {
            // Satellite imagery from ESRI
            tileLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Tiles &copy; Esri',
              maxZoom: 19,
            });
          } else {
            // OpenStreetMap
            tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
            });
          }
          tileLayer.addTo(map);

          // Add zoom control to bottom-right
          window.L.control.zoom({
            position: 'bottomright'
          }).addTo(map);

          // Create custom golden marker icon
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

          // Add marker
          const marker = window.L.marker([locationToUse.latitude, locationToUse.longitude], {
            icon: goldIcon
          }).addTo(map);
          
          marker.bindPopup(t('info.currentLocation')).openPopup();

          googleMapRef.current = map;
          setMapReady(true);
          
          console.log('✅ Leaflet map initialized successfully, mapReady set to true');
        } catch (error) {
          console.error('Error initializing Leaflet:', error);
          // Show error message
          if (mapContainerRef.current) {
            const messageDiv = mapContainerRef.current.querySelector('.map-error-message');
            if (messageDiv) {
              messageDiv.style.display = 'block';
              const errorDetails = messageDiv.querySelector('.error-details');
              if (errorDetails) {
                errorDetails.textContent = error.message;
              }
            }
          }
        }
      } else if (retryCount < maxRetries) {
        // Retry after a short delay
        retryCount++;
        if (retryCount % 10 === 0) {
          console.log(`Waiting for Leaflet to load... (attempt ${retryCount}/${maxRetries})`);
        }
        setTimeout(checkLeaflet, 100);
      } else if (retryCount >= maxRetries) {
        console.error('Leaflet not loaded after 10 seconds. Check your internet connection.');
        // Show user-friendly message
        if (mapContainerRef.current) {
          const messageDiv = mapContainerRef.current.querySelector('.map-error-message');
          if (messageDiv) {
            messageDiv.style.display = 'block';
          }
        }
      }
    };
    
    // Start checking immediately
    checkLeaflet();
  };

  const changeMapType = () => {
    const newType = mapType === 'satellite' ? 'standard' : 'satellite';
    setMapType(newType);
    
    if (Platform.OS === 'web' && googleMapRef.current && window.L) {
      // For Leaflet, remove old layer and add new one
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

  // Update map when location changes
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
        {/* Map View */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F4C430" />
            <Text style={styles.loadingText}>{t('map.loading')}</Text>
          </View>
        ) : locationToUse ? (
          Platform.OS === 'web' ? (
            <div
              ref={mapContainerRef}
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                backgroundColor: '#E5E5E5',
                position: 'relative',
                zIndex: 1,
                cursor: cornerSelectionMode ? 'crosshair' : 'grab',
              }}
            >
              {/* Fallback message if Google Maps doesn't load */}
              <div 
                className="map-error-message"
                style={{
                  display: 'none',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  padding: '24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  borderRadius: '16px',
                  maxWidth: '85%',
                  zIndex: 1000,
                  border: '2px solid #F4C430',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</div>
                <p style={{ 
                  color: '#B8860B', 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  margin: '0 0 12px 0' 
                }}>
                  Map Loading Error
                </p>
                <p style={{ 
                  color: '#8B7355', 
                  fontSize: '13px', 
                  margin: '0 0 16px 0',
                  lineHeight: '1.5'
                }}>
                  Unable to load map. Please check your internet connection and try again.
                </p>
                <p className="error-details" style={{ 
                  color: '#FF0000', 
                  fontSize: '11px', 
                  margin: 0,
                  fontFamily: 'monospace'
                }}></p>
                <p style={{ 
                  color: '#8B7355', 
                  fontSize: '12px', 
                  margin: 0,
                  fontStyle: 'italic'
                }}>
                  If the issue persists, please restart the app.
                </p>
              </div>
            </div>
          ) : (
            <MapView
              ref={googleMapRef}
              style={styles.map}
              initialRegion={locationToUse}
              mapType={mapType}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={false}
              rotateEnabled={true}
              pitchEnabled={false}
              onMapReady={() => {
                setMapReady(true);
                console.log('✅ Mobile map ready');
              }}
            >
              <Marker
                coordinate={{
                  latitude: locationToUse.latitude,
                  longitude: locationToUse.longitude,
                }}
                title={t('info.currentLocation')}
              />
              
              {/* Corner Markers - Mobile */}
              {cornerSelectionMode && plotCorners.map((corner, index) => (
                <Marker
                  key={`corner-${index}`}
                  coordinate={{
                    latitude: corner.latitude,
                    longitude: corner.longitude,
                  }}
                  draggable
                  onDragEnd={(e) => {
                    const updated = [...plotCorners];
                    updated[index] = {
                      latitude: e.nativeEvent.coordinate.latitude,
                      longitude: e.nativeEvent.coordinate.longitude,
                    };
                    setPlotCorners(updated);
                  }}
                  title={`Corner ${index + 1}`}
                  description={corner.name || `Drag to adjust`}
                >
                  <View style={styles.mobileCornerMarker}>
                    <View style={styles.mobileCornerDot}>
                      <Text style={styles.mobileCornerNumber}>{index + 1}</Text>
                    </View>
                  </View>
                </Marker>
              ))}
              
              {/* Plot Outline - Mobile */}
              {cornerSelectionMode && plotCorners.length >= 2 && (
                <Polyline
                  coordinates={plotCorners.length === 4 
                    ? [...plotCorners, plotCorners[0]]
                    : plotCorners
                  }
                  strokeColor="#FFD700"
                  strokeWidth={3}
                  lineDashPattern={[8, 4]}
                  lineCap="round"
                />
              )}
              
              {/* Vastu Grid - Mobile */}
              {Platform.OS !== 'web' && showVastuGrid && plotCorners.length === 4 && Polygon && Polyline && (
                <>
                  {/* Plot outline - Make it very visible */}
                  <Polygon
                    coordinates={[...plotCorners, plotCorners[0]]}
                    strokeColor="#FF6B35"
                    fillColor="transparent"
                    strokeWidth={5}
                  />
                  
                  {/* Grid lines - 9x9 vertical - Very visible */}
                  {Array.from({ length: 10 }).map((_, i) => {
                    const t = i / 9;
                    const bottomLat = plotCorners[0].latitude + (plotCorners[1].latitude - plotCorners[0].latitude) * t;
                    const bottomLng = plotCorners[0].longitude + (plotCorners[1].longitude - plotCorners[0].longitude) * t;
                    const topLat = plotCorners[3].latitude + (plotCorners[2].latitude - plotCorners[3].latitude) * t;
                    const topLng = plotCorners[3].longitude + (plotCorners[2].longitude - plotCorners[3].longitude) * t;
                    
                    return (
                      <Polyline
                        key={`v-${i}`}
                        coordinates={[
                          { latitude: bottomLat, longitude: bottomLng },
                          { latitude: topLat, longitude: topLng },
                        ]}
                        strokeColor={i % 3 === 0 ? "#FF6B35" : "#0f5257"}
                        strokeWidth={i % 3 === 0 ? 3 : 2}
                        lineDashPattern={i % 3 === 0 ? [] : [8, 4]}
                      />
                    );
                  })}
                  
                  {/* Grid lines - 9x9 horizontal - Very visible */}
                  {Array.from({ length: 10 }).map((_, i) => {
                    const t = i / 9;
                    const leftLat = plotCorners[0].latitude + (plotCorners[3].latitude - plotCorners[0].latitude) * t;
                    const leftLng = plotCorners[0].longitude + (plotCorners[3].longitude - plotCorners[0].longitude) * t;
                    const rightLat = plotCorners[1].latitude + (plotCorners[2].latitude - plotCorners[1].latitude) * t;
                    const rightLng = plotCorners[1].longitude + (plotCorners[2].longitude - plotCorners[1].longitude) * t;
                    
                    return (
                      <Polyline
                        key={`h-${i}`}
                        coordinates={[
                          { latitude: leftLat, longitude: leftLng },
                          { latitude: rightLat, longitude: rightLng },
                        ]}
                        strokeColor={i % 3 === 0 ? "#FF6B35" : "#0f5257"}
                        strokeWidth={i % 3 === 0 ? 3 : 2}
                        lineDashPattern={i % 3 === 0 ? [] : [8, 4]}
                      />
                    );
                  })}
                  
                  {/* Cell boundaries - Draw 3x3 main grid cells for better visibility */}
                  {Array.from({ length: 3 }).map((_, row) => 
                    Array.from({ length: 3 }).map((_, col) => {
                      const rowStart = row / 3;
                      const rowEnd = (row + 1) / 3;
                      const colStart = col / 3;
                      const colEnd = (col + 1) / 3;
                      
                      const blLat = plotCorners[0].latitude + (plotCorners[1].latitude - plotCorners[0].latitude) * colStart + (plotCorners[3].latitude - plotCorners[0].latitude) * rowStart;
                      const blLng = plotCorners[0].longitude + (plotCorners[1].longitude - plotCorners[0].longitude) * colStart + (plotCorners[3].longitude - plotCorners[0].longitude) * rowStart;
                      
                      const brLat = plotCorners[0].latitude + (plotCorners[1].latitude - plotCorners[0].latitude) * colEnd + (plotCorners[3].latitude - plotCorners[0].latitude) * rowStart;
                      const brLng = plotCorners[0].longitude + (plotCorners[1].longitude - plotCorners[0].longitude) * colEnd + (plotCorners[3].longitude - plotCorners[0].longitude) * rowStart;
                      
                      const trLat = plotCorners[0].latitude + (plotCorners[1].latitude - plotCorners[0].latitude) * colEnd + (plotCorners[3].latitude - plotCorners[0].latitude) * rowEnd;
                      const trLng = plotCorners[0].longitude + (plotCorners[1].longitude - plotCorners[0].longitude) * colEnd + (plotCorners[3].longitude - plotCorners[0].longitude) * rowEnd;
                      
                      const tlLat = plotCorners[0].latitude + (plotCorners[1].latitude - plotCorners[0].latitude) * colStart + (plotCorners[3].latitude - plotCorners[0].latitude) * rowEnd;
                      const tlLng = plotCorners[0].longitude + (plotCorners[1].longitude - plotCorners[0].longitude) * colStart + (plotCorners[3].longitude - plotCorners[0].longitude) * rowEnd;
                      
                      return (
                        <Polygon
                          key={`cell-${row}-${col}`}
                          coordinates={[
                            { latitude: blLat, longitude: blLng },
                            { latitude: brLat, longitude: brLng },
                            { latitude: trLat, longitude: trLng },
                            { latitude: tlLat, longitude: tlLng },
                          ]}
                          strokeColor="#FF6B35"
                          fillColor="rgba(255, 107, 53, 0.1)"
                          strokeWidth={3}
                        />
                      );
                    })
                  )}
                </>
              )}
            </MapView>
          )
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('map.error')}</Text>
          </View>
        )}

        {/* Compass Overlay - Toggle visibility */}
        {showCompass && locationToUse && !cornerSelectionMode && (
          <View style={[styles.compassOverlay, { pointerEvents: 'none', zIndex: 500, opacity: 0.6 }]}>
            <CompassView
              mode={mode}
              compassType={effectiveCompassType}
              capturedImage={null}
              onClearImage={() => {}}
              onHeadingChange={setHeading}
            />
          </View>
        )}

        {/* Top Navigation Bar - Same as compass view */}
        <View style={[styles.topBarContainer, { pointerEvents: 'box-none' }]}>
          <View style={{ pointerEvents: 'auto' }}>
            <CompassTopBar
              onMenuPress={() => {}} // Disabled in map view
              onSearchPress={() => setShowLocationSearch(!showLocationSearch)}
              onBackPress={onClose}
            />
          </View>
          
          {/* Map Controls */}
          <View style={[styles.mapControls, { pointerEvents: 'box-none' }]}>
             {/* Compass Toggle Button */}
             <TouchableOpacity
               style={[styles.mapControlButton, showCompass && styles.mapControlButtonActive, { pointerEvents: 'auto' }]}
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

             {/* Map Type Toggle */}
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
             
             {/* Vastu Grid Toggle - Corner Selection */}
             {!showVastuGrid && (
               <TouchableOpacity
                 style={[styles.mapControlButton, cornerSelectionMode && styles.mapControlButtonActive]}
                 onPress={() => {
                   const newMode = !cornerSelectionMode;
                   console.log('🔄 Toggling corner selection mode:', newMode);
                   setCornerSelectionMode(newMode);
                   
                   if (isMapLocked && newMode) {
                     // Auto-unlock map when starting selection
                     setIsMapLocked(false);
                     if (googleMapRef.current && window.L) {
                       googleMapRef.current.dragging.enable();
                       googleMapRef.current.touchZoom.enable();
                       googleMapRef.current.doubleClickZoom.enable();
                       googleMapRef.current.scrollWheelZoom.enable();
                       console.log('🔓 Map unlocked for corner selection');
                     }
                   }
                 }}
                 onPressIn={() => setPressedButton('vastu')}
                 onPressOut={() => setPressedButton(null)}
                 activeOpacity={0.6}
               >
                 <Text style={[styles.mapControlButtonText, pressedButton === 'vastu' && { opacity: 0.7 }]}>
                   {cornerSelectionMode ? '📍' : '⬜'}
                 </Text>
               </TouchableOpacity>
             )}
             
             {/* Apply Grid Button - Show when corners are being adjusted */}
             {cornerSelectionMode && plotCorners.length === 4 && (
               <TouchableOpacity
                 style={[styles.mapControlButton, styles.applyButton]}
                 onPress={() => {
                   console.log('✅ Applying Vastu grid with final corners:', plotCorners);
                   // Remove corner tooltips (make them non-permanent)
                   cornerMarkersRef.current.forEach(marker => {
                     if (marker && marker.unbindTooltip) {
                       marker.unbindTooltip();
                     }
                   });
                   setCornerSelectionMode(false);
                   // Grid will be drawn by the existing useEffect
                 }}
                 onPressIn={() => setPressedButton('apply')}
                 onPressOut={() => setPressedButton(null)}
                 activeOpacity={0.6}
               >
                 <Text style={[styles.applyButtonText, pressedButton === 'apply' && { opacity: 0.7 }]}>
                   ✓
                 </Text>
               </TouchableOpacity>
             )}
             
             {/* Clear Grid Button - Show when grid exists */}
             {showVastuGrid && (
               <TouchableOpacity
                 style={styles.mapControlButton}
                 onPress={() => {
                   console.log('🗑️ Clearing grid and corners');
                   // Clear all grid layers
                   gridLayersRef.current.forEach(layer => {
                     if (googleMapRef.current) {
                       googleMapRef.current.removeLayer(layer);
                     }
                   });
                   gridLayersRef.current = [];
                   setPlotCorners([]);
                   setShowVastuGrid(false);
                   setCornerSelectionMode(false);
                 }}
                 onPressIn={() => setPressedButton('clear')}
                 onPressOut={() => setPressedButton(null)}
                 activeOpacity={0.6}
               >
                 <Text style={[styles.mapControlButtonText, pressedButton === 'clear' && { opacity: 0.7 }]}>
                   🗑️
                 </Text>
               </TouchableOpacity>
             )}
             
             {/* Toggle Devta Labels - Show when grid exists */}
             {showVastuGrid && (
               <TouchableOpacity
                 style={[styles.mapControlButton, showDevtaLabels && styles.mapControlButtonActive]}
                 onPress={() => setShowDevtaLabels(!showDevtaLabels)}
                 onPressIn={() => setPressedButton('labels')}
                 onPressOut={() => setPressedButton(null)}
                 activeOpacity={0.6}
               >
                 <Text style={[styles.mapControlButtonText, pressedButton === 'labels' && { opacity: 0.7 }]}>
                   🏷️
                 </Text>
               </TouchableOpacity>
             )}
             
             {/* Toggle Brahmasthan - Show when grid exists */}
             {showVastuGrid && (
               <TouchableOpacity
                 style={[styles.mapControlButton, highlightBrahmasthan && styles.mapControlButtonActive]}
                 onPress={() => setHighlightBrahmasthan(!highlightBrahmasthan)}
                 onPressIn={() => setPressedButton('brahma')}
                 onPressOut={() => setPressedButton(null)}
                 activeOpacity={0.6}
               >
                 <Text style={[styles.mapControlButtonText, pressedButton === 'brahma' && { opacity: 0.7 }]}>
                   🕉️
                 </Text>
               </TouchableOpacity>
             )}
          </View>
        </View>

        {/* Corner Selection Info Banner */}
        {cornerSelectionMode && (
          <View style={[styles.cornerSelectionBanner, { pointerEvents: 'box-none' }]}>
            <View style={styles.pulseIndicator}>
              <View style={styles.pulseDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cornerSelectionTitle}>
                🎯 {t('map.cornerSelection.title')}
              </Text>
              <Text style={styles.cornerSelectionText}>
                👆 {t('map.cornerSelection.subtitle')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.cornerCancelButton, { pointerEvents: 'auto' }]}
              onPress={() => {
                setCornerSelectionMode(false);
                // Clear corners and grid when closing
                gridLayersRef.current.forEach(layer => {
                  if (googleMapRef.current) {
                    googleMapRef.current.removeLayer(layer);
                  }
                });
                gridLayersRef.current = [];
                setPlotCorners([]);
                setShowVastuGrid(false);
              }}
            >
              <Text style={styles.cornerCancelText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Vastu Grid Info Banner */}
        {showVastuGrid && plotCorners.length === 4 && (
          <View style={styles.vastuInfoBanner}>
            <Text style={styles.vastuInfoTitle}>✨ {t('map.gridActive.title')}</Text>
            <Text style={styles.vastuInfoText}>
              🕉️ {t('map.gridActive.subtitle')}
            </Text>
          </View>
        )}

        {/* Location Search Overlay */}
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

        {/* Bottom Info */}
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

        {/* Bottom Control Buttons */}
        <View style={styles.bottomControls}>
           {/* Download/Screenshot Button */}
           <TouchableOpacity
             style={styles.bottomButton}
             onPress={async () => {
               if (Platform.OS === 'web') {
                 try {
                   const html2canvas = (await import('html2canvas')).default;
                   
                   // Get the container element (everything inside the modal)
                   const containerElement = document.querySelector('.leaflet-container')?.parentElement?.parentElement || document.body;
                   
                   // Capture the screenshot
                   const canvas = await html2canvas(containerElement, {
                     useCORS: true,
                     allowTaint: true,
                     backgroundColor: '#000000',
                   });
                   
                   // Convert to blob and download
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

           {/* Recenter to Current Location Button */}
           <TouchableOpacity
             style={styles.bottomButton}
             onPress={() => {
               if (googleMapRef.current && currentLocation) {
                 googleMapRef.current.setView([currentLocation.latitude, currentLocation.longitude], 18);
                 setMapLocation(null); // Reset to current location
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

           {/* Lock/Unlock Map Button */}
           <TouchableOpacity
             style={[styles.bottomButton, isMapLocked && styles.bottomButtonActive]}
             onPress={() => {
               setIsMapLocked(!isMapLocked);
               if (googleMapRef.current && window.L) {
                 if (!isMapLocked) {
                   // Lock the map
                   googleMapRef.current.dragging.disable();
                   googleMapRef.current.touchZoom.disable();
                   googleMapRef.current.doubleClickZoom.disable();
                   googleMapRef.current.scrollWheelZoom.disable();
                 } else {
                   // Unlock the map
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

           {/* Go to Selected Location Button */}
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
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  },
  mobileCornerMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileCornerDot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF0000',
    borderWidth: 6,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  mobileCornerNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    pointerEvents: 'none', // Never block map clicks
  },
  topBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    pointerEvents: 'box-none', // Allow clicks through to map
  },
  mapControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? getResponsiveSize(80) : getResponsiveSize(90),
    right: getResponsiveSize(15),
    flexDirection: 'column',
    gap: getResponsiveSize(10),
    zIndex: 1001,
  },
  mapControlButton: {
    width: getResponsiveSize(44),
    height: getResponsiveSize(44),
    borderRadius: getResponsiveSize(22),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B8860B',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    pointerEvents: 'auto', // Ensure buttons are clickable
  },
  mapControlButtonActive: {
    borderColor: '#F4C430',
    backgroundColor: '#FFE082',
  },
  applyButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.98)',
    borderColor: '#4CAF50',
    borderWidth: 4,
    width: getResponsiveSize(56),
    height: getResponsiveSize(56),
    borderRadius: getResponsiveSize(28),
  },
  applyButtonText: {
    fontSize: getResponsiveFont(28),
    color: '#FFFFFF',
    fontWeight: '900',
  },
  mapControlButtonText: {
    fontSize: getResponsiveFont(22),
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
    top: Platform.OS === 'ios' ? getResponsiveSize(100) : getResponsiveSize(90),
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingTop: getResponsiveSize(10),
    paddingBottom: getResponsiveSize(20),
    maxHeight: '80%',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: getResponsiveSize(80),
    left: getResponsiveSize(15),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getResponsiveSize(8),
    borderWidth: 1,
    borderColor: '#F4C430',
    padding: getResponsiveSize(10),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  infoBox: {
    gap: getResponsiveSize(2),
  },
  infoLabel: {
    fontSize: getResponsiveFont(10),
    color: '#8B7355',
    fontWeight: '700',
    marginBottom: getResponsiveSize(2),
  },
  infoValue: {
    fontSize: getResponsiveFont(10),
    color: '#2C2C2C',
    fontWeight: '500',
  },
  bottomControls: {
    position: 'absolute',
    bottom: getResponsiveSize(20),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(15),
    zIndex: 600,
  },
  bottomButton: {
    width: getResponsiveSize(50),
    height: getResponsiveSize(50),
    borderRadius: getResponsiveSize(25),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B8860B',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bottomButtonActive: {
    borderColor: '#F4C430',
    backgroundColor: '#FFE082',
  },
  bottomButtonIcon: {
    fontSize: getResponsiveFont(24),
  },
  cornerSelectionBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? getResponsiveSize(140) : getResponsiveSize(130),
    left: getResponsiveSize(15),
    right: getResponsiveSize(140),
    backgroundColor: 'rgba(255, 69, 0, 0.98)',
    borderRadius: getResponsiveSize(12),
    padding: getResponsiveSize(14),
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(10),
  },
  pulseIndicator: {
    width: getResponsiveSize(12),
    height: getResponsiveSize(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    width: getResponsiveSize(12),
    height: getResponsiveSize(12),
    borderRadius: getResponsiveSize(6),
    backgroundColor: '#FFFFFF',
  },
  cornerSelectionTitle: {
    fontSize: getResponsiveFont(15),
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: getResponsiveSize(3),
    letterSpacing: 0.5,
  },
  cornerSelectionText: {
    fontSize: getResponsiveFont(12),
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '700',
  },
  cornerCancelButton: {
    width: getResponsiveSize(28),
    height: getResponsiveSize(28),
    borderRadius: getResponsiveSize(14),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerCancelText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFont(18),
    fontWeight: '700',
  },
  vastuInfoBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? getResponsiveSize(140) : getResponsiveSize(130),
    left: getResponsiveSize(15),
    right: getResponsiveSize(80),
    backgroundColor: 'rgba(65, 105, 225, 0.95)',
    borderRadius: getResponsiveSize(10),
    padding: getResponsiveSize(10),
    borderWidth: 2,
    borderColor: '#4169E1',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 999,
  },
  vastuInfoTitle: {
    fontSize: getResponsiveFont(13),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: getResponsiveSize(3),
  },
  vastuInfoText: {
    fontSize: getResponsiveFont(10),
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
});

