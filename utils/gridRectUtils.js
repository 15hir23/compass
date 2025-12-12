/**
 * Utility functions for converting map coordinates to screen rectangles
 * Used with GridRectOverlay component for drawing Vastu grid cells
 */

/**
 * Convert lat/lng coordinates to screen pixel coordinates
 * @param {Object} mapRef - React Native Maps MapView ref
 * @param {Array} latLngPoints - Array of {latitude, longitude} points
 * @returns {Promise<Array>} Array of {x, y} screen coordinates
 */
export const latLngToScreenCoords = async (mapRef, latLngPoints) => {
  if (!mapRef || !mapRef.current) {
    console.warn('Map ref not available');
    return [];
  }

  try {
    const screenCoords = await Promise.all(
      latLngPoints.map(point =>
        mapRef.current.coordinateForPoint
          ? mapRef.current.coordinateForPoint({ latitude: point.latitude, longitude: point.longitude })
          : Promise.resolve({ x: 0, y: 0 })
      )
    );
    return screenCoords;
  } catch (error) {
    console.error('Error converting coordinates:', error);
    return [];
  }
};

/**
 * Calculate grid bounds from 4 corner points
 * @param {Array} screenCorners - Array of 4 {x, y} screen coordinates
 * @returns {Object} {x, y, width, height} bounds
 */
export const getGridBounds = (screenCorners) => {
  if (!screenCorners || screenCorners.length !== 4) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = screenCorners.map(p => p.x);
  const ys = screenCorners.map(p => p.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Calculate cell rectangle from lat/lng corners using interpolation
 * @param {Array} plotCorners - Array of 4 {latitude, longitude} corner points
 * @param {number} row - Row index (0-8)
 * @param {number} col - Column index (0-8)
 * @param {number} gridSize - Grid size (default 9)
 * @returns {Object} Rectangle with screen coordinates {x, y, width, height}
 */
export const calculateCellRectFromLatLng = (plotCorners, row, col, gridSize = 9) => {
  if (!plotCorners || plotCorners.length !== 4) {
    return null;
  }

  // Calculate cell boundaries as fractions (0-1)
  const rowStart = row / gridSize;
  const rowEnd = (row + 1) / gridSize;
  const colStart = col / gridSize;
  const colEnd = (col + 1) / gridSize;

  // Calculate 4 corners of the cell in lat/lng
  // Using bilinear interpolation
  const getPoint = (r, c) => {
    // Interpolate between corners
    // Bottom-left corner is plotCorners[0]
    // Bottom-right corner is plotCorners[1]
    // Top-right corner is plotCorners[2]
    // Top-left corner is plotCorners[3]
    
    // First interpolate along bottom edge (r=0)
    const bottomLat = plotCorners[0].latitude + (plotCorners[1].latitude - plotCorners[0].latitude) * c;
    const bottomLng = plotCorners[0].longitude + (plotCorners[1].longitude - plotCorners[0].longitude) * c;
    
    // Then interpolate along top edge (r=1)
    const topLat = plotCorners[3].latitude + (plotCorners[2].latitude - plotCorners[3].latitude) * c;
    const topLng = plotCorners[3].longitude + (plotCorners[2].longitude - plotCorners[3].longitude) * c;
    
    // Finally interpolate vertically
    const lat = bottomLat + (topLat - bottomLat) * r;
    const lng = bottomLng + (topLng - bottomLng) * r;
    
    return { latitude: lat, longitude: lng };
  };

  // Get cell corners
  const bl = getPoint(rowStart, colStart); // bottom-left
  const br = getPoint(rowStart, colEnd);   // bottom-right
  const tr = getPoint(rowEnd, colEnd);     // top-right
  const tl = getPoint(rowEnd, colStart);   // top-left

  return {
    corners: [bl, br, tr, tl],
    row,
    col,
  };
};

/**
 * Convert cell corners from lat/lng to screen coordinates and create rectangle
 * @param {Object} mapRef - MapView ref
 * @param {Array} plotCorners - Array of 4 {latitude, longitude} corner points
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {number} gridSize - Grid size
 * @returns {Promise<Object>} Rectangle {id, x, y, width, height} or null
 */
export const getCellRectFromMap = async (mapRef, plotCorners, row, col, gridSize = 9) => {
  const cellData = calculateCellRectFromLatLng(plotCorners, row, col, gridSize);
  if (!cellData) return null;

  const screenCorners = await latLngToScreenCoords(mapRef, cellData.corners);
  if (screenCorners.length !== 4) return null;

  const bounds = getGridBounds(screenCorners);
  
  return {
    id: `cell-${row}-${col}`,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  };
};

/**
 * Get all grid cell rectangles from map coordinates
 * @param {Object} mapRef - MapView ref
 * @param {Array} plotCorners - Array of 4 {latitude, longitude} corner points
 * @param {number} gridSize - Grid size (default 9)
 * @param {Object} styleOptions - {borderColor, borderWidth, backgroundColor}
 * @returns {Promise<Array>} Array of rectangle objects
 */
export const getAllGridRectsFromMap = async (
  mapRef,
  plotCorners,
  gridSize = 9,
  styleOptions = {}
) => {
  const rectangles = [];
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const rect = await getCellRectFromMap(mapRef, plotCorners, row, col, gridSize);
      if (rect) {
        rectangles.push({
          ...rect,
          ...styleOptions,
        });
      }
    }
  }
  
  return rectangles;
};

/**
 * Get Brahmasthan cell rectangles from map coordinates
 * @param {Object} mapRef - MapView ref
 * @param {Array} plotCorners - Array of 4 {latitude, longitude} corner points
 * @param {Object} styleOptions - Styling options
 * @returns {Promise<Array>} Array of Brahmasthan rectangle objects
 */
export const getBrahmasthanRectsFromMap = async (
  mapRef,
  plotCorners,
  styleOptions = {}
) => {
  const gridSize = 9;
  const rectangles = [];
  const startRow = 3; // Center 3x3 starts at row 3
  const startCol = 3; // Center 3x3 starts at col 3
  
  for (let row = startRow; row < startRow + 3; row++) {
    for (let col = startCol; col < startCol + 3; col++) {
      const rect = await getCellRectFromMap(mapRef, plotCorners, row, col, gridSize);
      if (rect) {
        rectangles.push({
          ...rect,
          id: `brahmasthan-${row}-${col}`,
          borderColor: styleOptions.borderColor || '#FF8C00',
          borderWidth: styleOptions.borderWidth || 2,
          backgroundColor: styleOptions.backgroundColor || 'rgba(255, 165, 0, 0.35)',
          opacity: styleOptions.opacity || 1,
        });
      }
    }
  }
  
  return rectangles;
};

