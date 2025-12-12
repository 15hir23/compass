# Grid Rectangle Drawing API - Usage Guide

This API provides a simple way to draw calculated rectangles on screen, perfect for Vastu grid cells on maps and images.

## Components

### 1. `RectOverlay` - Draw Multiple Rectangles

Use this to overlay multiple grid cells or rectangles on top of maps/images.

```javascript
import { RectOverlay } from './components/GridRectOverlay';

const rectangles = [
  { 
    id: 1, 
    x: 50, 
    y: 100, 
    width: 80, 
    height: 60,
    borderColor: '#F4C430',
    borderWidth: 2,
    backgroundColor: 'transparent'
  },
  { 
    id: 2, 
    x: 150, 
    y: 200, 
    width: 100, 
    height: 100,
    borderColor: '#FF8C00',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 165, 0, 0.35)'
  },
];

<View style={{ flex: 1 }}>
  {/* Your map or image here */}
  <RectOverlay rectangles={rectangles} />
</View>
```

### 2. `Rect` - Single Rectangle

For simpler cases with just one rectangle:

```javascript
import { Rect } from './components/GridRectOverlay';

<View style={{ flex: 1 }}>
  {/* Your content */}
  <Rect 
    x={50} 
    y={120} 
    width={200} 
    height={100}
    borderColor="#F4C430"
    borderWidth={2}
  />
</View>
```

## Helper Functions

### For Screen Coordinates (Direct)

If you already have screen pixel coordinates:

```javascript
import { 
  getCellRect, 
  getAllGridRects, 
  getBrahmasthanRects,
  getOuterLayerRects,
  getMiddleLayerRects 
} from './components/GridRectOverlay';

// Define your grid bounds (in screen pixels)
const gridBounds = {
  x: 50,      // left position
  y: 100,     // top position
  width: 300, // grid width
  height: 300 // grid height
};

// Get a single cell rectangle
const cellRect = getCellRect(gridBounds, 3, 4, 9); // row 3, col 4, 9x9 grid

// Get all 81 cells
const allCells = getAllGridRects(gridBounds, {
  gridSize: 9,
  borderColor: '#F4C430',
  borderWidth: 1
});

// Get Brahmasthan cells (center 3x3)
const brahmasthanCells = getBrahmasthanRects(gridBounds, {
  borderColor: '#FF8C00',
  backgroundColor: 'rgba(255, 165, 0, 0.35)',
  borderWidth: 2
});

// Get outer layer cells (perimeter)
const outerCells = getOuterLayerRects(gridBounds);

// Get middle layer cells
const middleCells = getMiddleLayerRects(gridBounds);
```

### For Map Coordinates (Lat/Lng)

If you have map coordinates and need to convert to screen coordinates:

```javascript
import { 
  getAllGridRectsFromMap,
  getBrahmasthanRectsFromMap 
} from './utils/gridRectUtils';

// Assuming you have:
// - mapRef: React Native Maps MapView ref
// - plotCorners: Array of 4 {latitude, longitude} points

const gridRects = await getAllGridRectsFromMap(
  mapRef,
  plotCorners,
  9, // grid size
  {
    borderColor: '#F4C430',
    borderWidth: 1,
    backgroundColor: 'transparent'
  }
);

const brahmasthanRects = await getBrahmasthanRectsFromMap(
  mapRef,
  plotCorners,
  {
    borderColor: '#FF8C00',
    backgroundColor: 'rgba(255, 165, 0, 0.35)',
    borderWidth: 2
  }
);
```

## Complete Example: Vastu Grid on Map

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import { RectOverlay } from './components/GridRectOverlay';
import { getAllGridRectsFromMap, getBrahmasthanRectsFromMap } from './utils/gridRectUtils';

export default function VastuMapView() {
  const [gridRects, setGridRects] = useState([]);
  const [brahmasthanRects, setBrahmasthanRects] = useState([]);
  const mapRef = useRef(null);
  const plotCorners = [
    { latitude: 28.6139, longitude: 77.2090 }, // bottom-left
    { latitude: 28.6140, longitude: 77.2091 }, // bottom-right
    { latitude: 28.6141, longitude: 77.2091 }, // top-right
    { latitude: 28.6141, longitude: 77.2090 }, // top-left
  ];

  useEffect(() => {
    if (mapRef.current && plotCorners.length === 4) {
      // Calculate grid rectangles from map coordinates
      getAllGridRectsFromMap(mapRef, plotCorners, 9, {
        borderColor: '#F4C430',
        borderWidth: 1,
        backgroundColor: 'transparent'
      }).then(setGridRects);

      // Calculate Brahmasthan rectangles
      getBrahmasthanRectsFromMap(mapRef, plotCorners, {
        borderColor: '#FF8C00',
        backgroundColor: 'rgba(255, 165, 0, 0.35)',
        borderWidth: 2
      }).then(setBrahmasthanRects);
    }
  }, [mapRef.current, plotCorners]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        // ... other map props
      />
      
      {/* Overlay grid rectangles */}
      <RectOverlay rectangles={[...gridRects, ...brahmasthanRects]} />
    </View>
  );
}
```

## Example: Simple Screen-Based Grid

If you're drawing on a fixed-size view (like an image overlay):

```javascript
import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { RectOverlay, getAllGridRects, getBrahmasthanRects } from './components/GridRectOverlay';

const { width, height } = Dimensions.get('window');
const gridSize = 300;
const gridX = (width - gridSize) / 2;
const gridY = 100;

export default function SimpleGrid() {
  const gridBounds = {
    x: gridX,
    y: gridY,
    width: gridSize,
    height: gridSize
  };

  const allCells = getAllGridRects(gridBounds, {
    gridSize: 9,
    borderColor: '#F4C430',
    borderWidth: 1
  });

  const brahmasthanCells = getBrahmasthanRects(gridBounds, {
    borderColor: '#FF8C00',
    backgroundColor: 'rgba(255, 165, 0, 0.35)',
    borderWidth: 2
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Your background content */}
      
      <RectOverlay rectangles={[...allCells, ...brahmasthanCells]} />
    </View>
  );
}
```

## API Reference

### Rectangle Object

```typescript
type Rectangle = {
  id: string | number;      // Unique identifier
  x: number;                 // Left position in pixels
  y: number;                // Top position in pixels
  width: number;            // Width in pixels
  height: number;           // Height in pixels
  borderColor?: string;     // Border color (default: '#F4C430')
  borderWidth?: number;      // Border width (default: 2)
  backgroundColor?: string;  // Background color (default: 'transparent')
  opacity?: number;          // Opacity 0-1 (default: 1)
};
```

### Functions

- `getCellRect(gridBounds, row, col, gridSize)` - Get single cell rectangle
- `getAllGridRects(gridBounds, options)` - Get all grid cell rectangles
- `getBrahmasthanRects(gridBounds, options)` - Get center 3x3 cells
- `getOuterLayerRects(gridBounds, options)` - Get perimeter cells
- `getMiddleLayerRects(gridBounds, options)` - Get middle ring cells
- `getAllGridRectsFromMap(mapRef, plotCorners, gridSize, options)` - Convert from lat/lng
- `getBrahmasthanRectsFromMap(mapRef, plotCorners, options)` - Convert from lat/lng

## Notes

- All coordinates are in screen pixels
- Rectangles are absolutely positioned
- Use `pointerEvents="none"` on RectOverlay to allow touches to pass through
- For web, this works with React Native Web
- For native, works with standard React Native Views

