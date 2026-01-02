import React from 'react';
import Svg, { Path, Circle, G, Line, Rect } from 'react-native-svg';

// Download Icon - Arrow pointing down into a box
export const DownloadIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Recenter/Target Icon - Crosshair with circle
export const RecenterIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="8"
      stroke={color}
      strokeWidth="2.5"
      fill="none"
    />
    <Circle
      cx="12"
      cy="12"
      r="2"
      fill={color}
    />
    <Line
      x1="12"
      y1="2"
      x2="12"
      y2="6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Line
      x1="12"
      y1="18"
      x2="12"
      y2="22"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Line
      x1="2"
      y1="12"
      x2="6"
      y2="12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Line
      x1="18"
      y1="12"
      x2="22"
      y2="12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Lock Icon - Padlock
export const LockIcon = ({ size = 24, color = '#000000', locked = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {locked ? (
      // Locked - closed padlock
      <>
        <Rect
          x="5"
          y="11"
          width="14"
          height="11"
          rx="2"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        <Path
          d="M7 11V7a5 5 0 0 1 10 0v4"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Circle
          cx="12"
          cy="16"
          r="1.5"
          fill={color}
        />
      </>
    ) : (
      // Unlocked - open shackle swung to the side
      <>
        <Rect
          x="5"
          y="11"
          width="14"
          height="11"
          rx="2"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        <Path
          d="M7 11V7a5 5 0 0 1 10 0v4h3"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Circle
          cx="12"
          cy="16"
          r="1.5"
          fill={color}
        />
      </>
    )}
  </Svg>
);

// Pin/Location Icon - Map pin
export const PinIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Circle
      cx="12"
      cy="10"
      r="3"
      stroke={color}
      strokeWidth="2.5"
      fill="none"
    />
  </Svg>
);

// Compass Toggle Icon - Compass with needle
export const CompassToggleIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="9"
      stroke={color}
      strokeWidth="2.5"
      fill="none"
    />
    <Path
      d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.3"
    />
    <Circle
      cx="12"
      cy="12"
      r="1.5"
      fill={color}
    />
  </Svg>
);

// Map Layer Icon - Layers stacked
export const MapLayerIcon = ({ size = 24, color = '#000000', isSatellite = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {isSatellite ? (
      // Satellite view - grid pattern
      <G>
        <Rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.5" />
        <Line x1="3" y1="15" x2="21" y2="15" stroke={color} strokeWidth="1.5" />
        <Line x1="9" y1="3" x2="9" y2="21" stroke={color} strokeWidth="1.5" />
        <Line x1="15" y1="3" x2="15" y2="21" stroke={color} strokeWidth="1.5" />
      </G>
    ) : (
      // Street view - map with route
      <G>
        <Path
          d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Line x1="9" y1="4" x2="9" y2="17" stroke={color} strokeWidth="1.5" />
        <Line x1="15" y1="7" x2="15" y2="20" stroke={color} strokeWidth="1.5" />
      </G>
    )}
  </Svg>
);

// Camera Icon
export const CameraIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Circle
      cx="12"
      cy="13"
      r="4"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

// Search Icon
export const SearchIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="11"
      cy="11"
      r="8"
      stroke={color}
      strokeWidth="2.5"
      fill="none"
    />
    <Line
      x1="21"
      y1="21"
      x2="16.65"
      y2="16.65"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Location/Map Pin Icon
export const LocationIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Circle
      cx="12"
      cy="10"
      r="3"
      fill={color}
    />
  </Svg>
);

// Menu/Hamburger Icon
export const MenuIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

// Back Arrow Icon
export const BackArrowIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Share Icon
export const ShareIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2" fill="none" />
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" />
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2" fill="none" />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={color} strokeWidth="2" />
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={color} strokeWidth="2" />
  </Svg>
);

// Close/X Icon
export const CloseIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line
      x1="18"
      y1="6"
      x2="6"
      y2="18"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Line
      x1="6"
      y1="6"
      x2="18"
      y2="18"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Compass/North Icon
export const CompassIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
      fill={color}
      fillOpacity="0.8"
    />
    <Circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
  </Svg>
);

// Image/Gallery Icon
export const ImageIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
    <Path
      d="M21 15l-5-5L5 21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Triangle/Play Icon (for Last Captured)
export const TriangleIcon = ({ size = 24, color = '#000000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 3l14 9-14 9V3z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.3"
    />
  </Svg>
);

