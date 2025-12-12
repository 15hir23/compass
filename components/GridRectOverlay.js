import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

/**
 * Rectangle drawing API for Vastu grid cells
 * Used to overlay calculated rectangles on maps/images
 * 
 * @typedef {Object} Rectangle
 * @property {string|number} id - Unique identifier
 * @property {number} x - Left position in pixels
 * @property {number} y - Top position in pixels
 * @property {number} width - Width in pixels
 * @property {number} height - Height in pixels
 * @property {string} [borderColor] - Border color (default: '#F4C430')
 * @property {number} [borderWidth] - Border width (default: 2)
 * @property {string} [backgroundColor] - Background color (default: 'transparent')
 * @property {number} [opacity] - Opacity 0-1 (default: 1)
 */

/**
 * @typedef {Object} RectOverlayProps
 * @property {Rectangle[]} rectangles - Array of rectangles to draw
 * @property {'auto'|'none'|'box-none'|'box-only'} [pointerEvents] - Pointer events behavior
 */

/**
 * Overlay component that draws multiple rectangles
 * Use this to draw grid cells, Brahmasthan highlights, etc.
 * @param {RectOverlayProps} props
 */
export const RectOverlay = ({ 
  rectangles, 
  pointerEvents = 'none' 
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={pointerEvents}>
      {rectangles.map((r) => (
        <View
          key={r.id}
          style={[
            styles.rect,
            {
              left: r.x,
              top: r.y,
              width: r.width,
              height: r.height,
              borderColor: r.borderColor || '#F4C430',
              borderWidth: r.borderWidth ?? 2,
              backgroundColor: r.backgroundColor || 'transparent',
              opacity: r.opacity ?? 1,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  rect: {
    position: 'absolute',
  },
});

/**
 * Single rectangle component (for simpler use cases)
 * @param {Object} props
 * @param {number} props.x - Left position
 * @param {number} props.y - Top position
 * @param {number} props.width - Width
 * @param {number} props.height - Height
 * @param {string} [props.borderColor] - Border color
 * @param {number} [props.borderWidth] - Border width
 * @param {string} [props.backgroundColor] - Background color
 * @param {number} [props.opacity] - Opacity
 */
export const Rect = ({
  x,
  y,
  width,
  height,
  borderColor = '#F4C430',
  borderWidth = 2,
  backgroundColor = 'transparent',
  opacity = 1,
}) => {
  return (
    <View
      style={[
        styles.rect,
        {
          left: x,
          top: y,
          width,
          height,
          borderColor,
          borderWidth,
          backgroundColor,
          opacity,
        },
      ]}
    />
  );
};

/**
 * Grid Drawing API
 * Helper functions to calculate grid cell rectangles
 */

/**
 * Calculate rectangle for a single grid cell
 * @param {Object} gridBounds - { x, y, width, height } of entire grid
 * @param {number} row - Row index (0-8 for 9x9 grid)
 * @param {number} col - Column index (0-8 for 9x9 grid)
 * @param {number} gridSize - Grid size (9 for 9x9)
 * @returns {Rectangle} Rectangle for the cell
 */
export const getCellRect = (gridBounds, row, col, gridSize = 9) => {
  const cellWidth = gridBounds.width / gridSize;
  const cellHeight = gridBounds.height / gridSize;
  
  return {
    id: `cell-${row}-${col}`,
    x: gridBounds.x + col * cellWidth,
    y: gridBounds.y + row * cellHeight,
    width: cellWidth,
    height: cellHeight,
  };
};

/**
 * Get all rectangles for a 9x9 grid
 * @param {Object} gridBounds - { x, y, width, height } of entire grid
 * @param {Object} options - { gridSize, borderColor, borderWidth, backgroundColor }
 * @returns {Rectangle[]} Array of all cell rectangles
 */
export const getAllGridRects = (gridBounds, options = {}) => {
  const {
    gridSize = 9,
    borderColor = '#F4C430',
    borderWidth = 1,
    backgroundColor = 'transparent',
  } = options;
  
  const rectangles = [];
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cellRect = getCellRect(gridBounds, row, col, gridSize);
      rectangles.push({
        ...cellRect,
        borderColor,
        borderWidth,
        backgroundColor,
      });
    }
  }
  
  return rectangles;
};

/**
 * Get rectangles for Brahmasthan cells (center 3x3 = 9 cells)
 * @param {Object} gridBounds - { x, y, width, height } of entire grid
 * @param {Object} options - { gridSize, borderColor, borderWidth, backgroundColor, opacity }
 * @returns {Rectangle[]} Array of Brahmasthan cell rectangles
 */
export const getBrahmasthanRects = (gridBounds, options = {}) => {
  const {
    gridSize = 9,
    borderColor = '#FF8C00',
    borderWidth = 2,
    backgroundColor = 'rgba(255, 165, 0, 0.35)',
    opacity = 1,
  } = options;
  
  const rectangles = [];
  const startRow = Math.floor(gridSize / 2) - 1; // 3 for 9x9
  const startCol = Math.floor(gridSize / 2) - 1; // 3 for 9x9
  
  // Center 3x3 cells
  for (let row = startRow; row < startRow + 3; row++) {
    for (let col = startCol; col < startCol + 3; col++) {
      const cellRect = getCellRect(gridBounds, row, col, gridSize);
      rectangles.push({
        ...cellRect,
        id: `brahmasthan-${row}-${col}`,
        borderColor,
        borderWidth,
        backgroundColor,
        opacity,
      });
    }
  }
  
  return rectangles;
};

/**
 * Get rectangles for outer layer cells (perimeter of 9x9 grid)
 * @param {Object} gridBounds - { x, y, width, height } of entire grid
 * @param {Object} options - Styling options
 * @returns {Rectangle[]} Array of outer layer cell rectangles
 */
export const getOuterLayerRects = (gridBounds, options = {}) => {
  const {
    gridSize = 9,
    borderColor = '#F4C430',
    borderWidth = 1,
    backgroundColor = 'transparent',
  } = options;
  
  const rectangles = [];
  
  // Top and bottom rows
  for (let col = 0; col < gridSize; col++) {
    rectangles.push({
      ...getCellRect(gridBounds, 0, col, gridSize),
      borderColor,
      borderWidth,
      backgroundColor,
    });
    rectangles.push({
      ...getCellRect(gridBounds, gridSize - 1, col, gridSize),
      borderColor,
      borderWidth,
      backgroundColor,
    });
  }
  
  // Left and right columns (excluding corners already added)
  for (let row = 1; row < gridSize - 1; row++) {
    rectangles.push({
      ...getCellRect(gridBounds, row, 0, gridSize),
      borderColor,
      borderWidth,
      backgroundColor,
    });
    rectangles.push({
      ...getCellRect(gridBounds, row, gridSize - 1, gridSize),
      borderColor,
      borderWidth,
      backgroundColor,
    });
  }
  
  return rectangles;
};

/**
 * Get rectangles for middle layer cells (one cell in from perimeter)
 * @param {Object} gridBounds - { x, y, width, height } of entire grid
 * @param {Object} options - Styling options
 * @returns {Rectangle[]} Array of middle layer cell rectangles
 */
export const getMiddleLayerRects = (gridBounds, options = {}) => {
  const {
    gridSize = 9,
    borderColor = '#FFD700',
    borderWidth = 1,
    backgroundColor = 'transparent',
  } = options;
  
  const rectangles = [];
  
  // Rows 1 and 7 (excluding corners)
  for (let col = 1; col < gridSize - 1; col++) {
    rectangles.push({
      ...getCellRect(gridBounds, 1, col, gridSize),
      borderColor,
      borderWidth,
      backgroundColor,
    });
    rectangles.push({
      ...getCellRect(gridBounds, gridSize - 2, col, gridSize),
      borderColor,
      borderWidth,
      backgroundColor,
    });
  }
  
  // Columns 1 and 7 (excluding corners and already added cells)
  for (let row = 2; row < gridSize - 2; row++) {
    rectangles.push({
      ...getCellRect(gridBounds, row, 1, gridSize),
      borderColor,
      borderWidth,
      backgroundColor,
    });
    rectangles.push({
      ...getCellRect(gridBounds, row, gridSize - 2, gridSize),
      borderColor,
      borderWidth,
      backgroundColor,
    });
  }
  
  return rectangles;
};

