// 45 Devta Vastu System - 3 Layers
// Outer Layer, Middle Layer, Center Layer

/**
 * 3x3 Main Grid subdivided into cells for 45 devtas
 * Each main cell is further divided based on position
 */

// OUTER LAYER (Perimeter - 28 devtas)
export const OUTER_LAYER = {
  // Top row (North) - 9 devtas
  north: [
    { devta: 'Vayu', zone: 'NW', energy: 'positive', color: '#87CEEB' },
    { devta: 'Naga', zone: 'NNW', energy: 'neutral', color: '#87CEEB' },
    { devta: 'Mukhya', zone: 'NNW', energy: 'neutral', color: '#87CEEB' },
    { devta: 'Bhallat', zone: 'N', energy: 'neutral', color: '#87CEEB' },
    { devta: 'Soma', zone: 'N', energy: 'positive', color: '#4169E1' },
    { devta: 'Aap', zone: 'N', energy: 'positive', color: '#87CEEB' },
    { devta: 'Aditi', zone: 'NNE', energy: 'very positive', color: '#4169E1' },
    { devta: 'Diti', zone: 'NNE', energy: 'positive', color: '#4169E1' },
    { devta: 'Isha', zone: 'NE', energy: 'divine', color: '#0000CD' },
  ],
  
  // Right column (East) - 7 devtas (excluding corners)
  east: [
    { devta: 'Parjanya', zone: 'ENE', energy: 'positive', color: '#90EE90' },
    { devta: 'Jayanta', zone: 'E', energy: 'positive', color: '#90EE90' },
    { devta: 'Mahendra', zone: 'E', energy: 'very positive', color: '#32CD32' },
    { devta: 'Aditya', zone: 'E', energy: 'positive', color: '#90EE90' },
    { devta: 'Satya', zone: 'ESE', energy: 'positive', color: '#90EE90' },
    { devta: 'Bhrisha', zone: 'ESE', energy: 'neutral', color: '#90EE90' },
    { devta: 'Antariksh', zone: 'SE', energy: 'neutral', color: '#FFD700' },
  ],
  
  // Bottom row (South) - 9 devtas
  south: [
    { devta: 'Agni', zone: 'SE', energy: 'positive', color: '#FFD700' },
    { devta: 'Pusha', zone: 'SSE', energy: 'positive', color: '#FFA500' },
    { devta: 'Vitatha', zone: 'SSE', energy: 'neutral', color: '#FFA500' },
    { devta: 'Gruhakshat', zone: 'S', energy: 'neutral', color: '#FFA500' },
    { devta: 'Yama', zone: 'S', energy: 'negative', color: '#CD853F' },
    { devta: 'Gandharva', zone: 'S', energy: 'neutral', color: '#FFA500' },
    { devta: 'Bhujang', zone: 'SSW', energy: 'negative', color: '#A0522D' },
    { devta: 'Mriga', zone: 'SSW', energy: 'neutral', color: '#A0522D' },
    { devta: 'Pitru', zone: 'SW', energy: 'negative', color: '#8B4513' },
  ],
  
  // Left column (West) - 7 devtas (excluding corners)
  west: [
    { devta: 'Dauvarika', zone: 'WSW', energy: 'neutral', color: '#CD853F' },
    { devta: 'Sugriva', zone: 'W', energy: 'neutral', color: '#CD853F' },
    { devta: 'Pushpadanta', zone: 'W', energy: 'positive', color: '#DEB887' },
    { devta: 'Varuna', zone: 'W', energy: 'neutral', color: '#CD853F' },
    { devta: 'Asura', zone: 'WNW', energy: 'negative', color: '#A0522D' },
    { devta: 'Shosha', zone: 'WNW', energy: 'negative', color: '#A0522D' },
    { devta: 'Roga', zone: 'NW', energy: 'negative', color: '#8B4513' },
  ],
};

// MIDDLE LAYER (8 devtas around center)
export const MIDDLE_LAYER = [
  { devta: 'Rudrajay', zone: 'N-Center', energy: 'positive', color: '#87CEEB' },
  { devta: 'Aapvatsa', zone: 'E-Center', energy: 'positive', color: '#90EE90' },
  { devta: 'Savitra', zone: 'S-Center', energy: 'positive', color: '#FFA500' },
  { devta: 'Indrajay', zone: 'W-Center', energy: 'positive', color: '#DEB887' },
  { devta: 'Rudra', zone: 'NW-Inner', energy: 'neutral', color: '#A0522D' },
  { devta: 'Aap', zone: 'NE-Inner', energy: 'very positive', color: '#4169E1' },
  { devta: 'Indra', zone: 'SW-Inner', energy: 'neutral', color: '#A0522D' },
  { devta: 'Svitra', zone: 'SE-Inner', energy: 'positive', color: '#FFD700' },
];

// CENTER LAYER (Brahmasthan - 1 devta)
export const CENTER_LAYER = {
  devta: 'Brahma',
  zone: 'BRAHMASTHAN',
  energy: 'divine',
  color: '#FFA500'
};

/**
 * Get layer division coordinates
 * Returns 4 points: [0, 1/3, 2/3, 1] for both x and y
 */
export function getLayerDivisions() {
  return [0, 1/3, 2/3, 1];
}

/**
 * Get all 45 devtas organized by layer
 */
export function getAll45Devtas() {
  const all = [];
  
  // Outer layer
  OUTER_LAYER.north.forEach(d => all.push(d));
  OUTER_LAYER.east.forEach(d => all.push(d));
  OUTER_LAYER.south.forEach(d => all.push(d));
  OUTER_LAYER.west.forEach(d => all.push(d));
  
  // Middle layer
  MIDDLE_LAYER.forEach(d => all.push(d));
  
  // Center
  all.push(CENTER_LAYER);
  
  return all;
}

/**
 * Get cells for specific layer
 */
export function getLayerCells(layer) {
  if (layer === 'outer') {
    // Returns positions for outer 28 devtas
    return getOuterLayerCells();
  } else if (layer === 'middle') {
    // Returns positions for middle 8 devtas
    return getMiddleLayerCells();
  } else if (layer === 'center') {
    // Returns position for Brahma
    return { row: 1, col: 1, rowSpan: 1, colSpan: 1 };
  }
}

function getOuterLayerCells() {
  const cells = [];
  
  // Top row (North) - 9 cells, row 0, cols 0-8
  for (let col = 0; col < 9; col++) {
    cells.push({ 
      row: 0, 
      col, 
      devta: OUTER_LAYER.north[col],
      layer: 'outer'
    });
  }
  
  // Right column (East) - 7 cells (excluding corners), col 8, rows 1-7
  for (let row = 1; row < 8; row++) {
    cells.push({ 
      row, 
      col: 8, 
      devta: OUTER_LAYER.east[row - 1],
      layer: 'outer'
    });
  }
  
  // Bottom row (South) - 9 cells, row 8, cols 8-0 (reversed)
  for (let col = 8; col >= 0; col--) {
    cells.push({ 
      row: 8, 
      col, 
      devta: OUTER_LAYER.south[8 - col],
      layer: 'outer'
    });
  }
  
  // Left column (West) - 7 cells (excluding corners), col 0, rows 7-1
  for (let row = 7; row > 0; row--) {
    cells.push({ 
      row, 
      col: 0, 
      devta: OUTER_LAYER.west[7 - row],
      layer: 'outer'
    });
  }
  
  return cells;
}

function getMiddleLayerCells() {
  // Middle layer in 3x3 grid positions (excluding center)
  return [
    { row: 1, col: 1, rowSpan: 1, colSpan: 1, devta: MIDDLE_LAYER[0], layer: 'middle', pos: 'N' },
    { row: 1, col: 2, rowSpan: 1, colSpan: 1, devta: MIDDLE_LAYER[1], layer: 'middle', pos: 'NE' },
    { row: 2, col: 2, rowSpan: 1, colSpan: 1, devta: MIDDLE_LAYER[2], layer: 'middle', pos: 'E' },
    { row: 2, col: 1, rowSpan: 1, colSpan: 1, devta: MIDDLE_LAYER[3], layer: 'middle', pos: 'SE' },
    { row: 2, col: 0, rowSpan: 1, colSpan: 1, devta: MIDDLE_LAYER[4], layer: 'middle', pos: 'S' },
    { row: 1, col: 0, rowSpan: 1, colSpan: 1, devta: MIDDLE_LAYER[5], layer: 'middle', pos: 'SW' },
    { row: 0, col: 0, rowSpan: 1, colSpan: 1, devta: MIDDLE_LAYER[6], layer: 'middle', pos: 'W' },
    { row: 0, col: 1, rowSpan: 1, colSpan: 1, devta: MIDDLE_LAYER[7], layer: 'middle', pos: 'NW' },
  ];
}

export const LAYER_COLORS = {
  outer: 'rgba(255, 215, 0, 0.3)',
  middle: 'rgba(255, 165, 0, 0.4)',
  center: 'rgba(255, 140, 0, 0.6)',
};

