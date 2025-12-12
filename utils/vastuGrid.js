// Vastu Purusha Mandala 9×9 Grid
// Exact structure and names from HTML code

/**
 * 9×9 Vastu Grid - Matching HTML structure exactly
 * Row 0 = North (top)
 * Row 8 = South (bottom)
 * Col 0 = West (left)
 * Col 8 = East (right)
 */
// Premium Golden/Yellow Color Palette
// Divine/Very Positive: Rich Gold, Deep Gold
// Positive: Golden Yellow, Amber, Light Gold
// Neutral: Mellow Yellow, Cream, Champagne, Butter
// Negative: Mustard, Honey (still in golden family but muted)

export const VASTU_GRID_9X9 = [
  // Row 0 (North - top row)
  [
    { devta: 'Vayu', zone: 'NW', energy: 'positive', color: '#FFC125' }, // Golden Yellow
    { devta: 'Naag', zone: 'NNW', energy: 'neutral', color: '#F0E68C' }, // Khaki (pastel)
    { devta: 'Mukhya', zone: 'NNW', energy: 'neutral', color: '#F0E68C' }, // Khaki (pastel)
    { devta: 'Bhallat', zone: 'N', energy: 'neutral', color: '#FFF8DC' }, // Cornsilk (pastel)
    { devta: 'Som', zone: 'N', energy: 'positive', color: '#FFD700' }, // Gold
    { devta: 'Charak', zone: 'N', energy: 'neutral', color: '#FFF8DC' }, // Cornsilk (pastel)
    { devta: 'Aditi', zone: 'NNE', energy: 'very positive', color: '#FFE87C' }, // Light Gold (lighter)
    { devta: 'Uditi', zone: 'NNE', energy: 'positive', color: '#FFC125' }, // Golden Yellow
    { devta: 'Isha', zone: 'NE', energy: 'very positive', color: '#FFE87C' }, // Light Gold (lighter)
  ],
  // Row 1
  [
    { devta: 'Rog', zone: 'NW', energy: 'negative', color: '#F0A500' }, // Honey Gold
    { devta: 'Rudrajay', zone: 'NW', energy: 'neutral', color: '#FFE87C' }, // Light Gold
    { devta: null, zone: null, energy: null, color: null }, // Empty cell
    { devta: 'Bhoodhar', zone: 'N', energy: 'positive', color: '#FFC125' }, // Merged 3x3 - Golden Yellow
    { devta: 'Bhoodhar', zone: 'N', energy: 'positive', color: '#FFC125' },
    { devta: 'Bhoodhar', zone: 'N', energy: 'positive', color: '#FFC125' },
    { devta: 'Aap', zone: 'NNE', energy: 'very positive', color: '#FFE87C' }, // Merged 2 cols - Light Gold (lighter)
    { devta: 'Aap', zone: 'NNE', energy: 'very positive', color: '#FFE87C' },
    { devta: 'Parjanya', zone: 'ENE', energy: 'positive', color: '#FFC125' }, // Golden Yellow
  ],
  // Row 2
  [
    { devta: 'Sosh', zone: 'WNW', energy: 'negative', color: '#F0A500' }, // Honey Gold
    { devta: 'Rudrajay', zone: 'NW', energy: 'neutral', color: '#FFE87C' }, // Merged continues - Light Gold
    { devta: 'Rudra', zone: 'NNW', energy: 'neutral', color: '#F0E68C' }, // Khaki (pastel)
    { devta: 'Bhoodhar', zone: 'N', energy: 'positive', color: '#FFC125' }, // Merged continues - Golden Yellow
    { devta: 'Bhoodhar', zone: 'N', energy: 'positive', color: '#FFC125' },
    { devta: 'Bhoodhar', zone: 'N', energy: 'positive', color: '#FFC125' },
    { devta: 'Aapvatsa', zone: 'NNE', energy: 'positive', color: '#FFC125' }, // Merged 2 cols - Golden Yellow
    { devta: 'Aapvatsa', zone: 'NNE', energy: 'positive', color: '#FFC125' },
    { devta: 'Jayant', zone: 'E', energy: 'positive', color: '#FFC125' }, // Golden Yellow
  ],
  // Row 3
  [
    { devta: 'Asur', zone: 'WNW', energy: 'negative', color: '#F0A500' }, // Honey Gold
    { devta: 'Mitra', zone: 'W', energy: 'positive', color: '#FFD700' }, // Merged 3x2 - Gold
    { devta: 'Mitra', zone: 'W', energy: 'positive', color: '#FFD700' },
    { devta: 'Brahma', zone: 'BRAHMASTHAN', energy: 'divine', color: '#FFD700' }, // Merged 3x3 - Pure Gold
    { devta: 'Brahma', zone: 'BRAHMASTHAN', energy: 'divine', color: '#FFD700' },
    { devta: 'Brahma', zone: 'BRAHMASTHAN', energy: 'divine', color: '#FFD700' },
    { devta: 'Aryama', zone: 'E', energy: 'positive', color: '#FFD700' }, // Merged 3x2 - Gold
    { devta: 'Aryama', zone: 'E', energy: 'positive', color: '#FFD700' },
    { devta: 'Mahendra', zone: 'E', energy: 'very positive', color: '#FFE87C' }, // Light Gold (lighter)
  ],
  // Row 4
  [
    { devta: 'Varun', zone: 'W', energy: 'neutral', color: '#F7E7CE' }, // Champagne (pastel)
    { devta: 'Mitra', zone: 'W', energy: 'positive', color: '#FFD700' }, // Merged continues - Gold
    { devta: 'Mitra', zone: 'W', energy: 'positive', color: '#FFD700' },
    { devta: 'Brahma', zone: 'BRAHMASTHAN', energy: 'divine', color: '#FFD700' }, // Merged continues - Pure Gold
    { devta: 'Brahma', zone: 'BRAHMASTHAN', energy: 'divine', color: '#FFD700' },
    { devta: 'Brahma', zone: 'BRAHMASTHAN', energy: 'divine', color: '#FFD700' },
    { devta: 'Aryama', zone: 'E', energy: 'positive', color: '#FFD700' }, // Merged continues - Gold
    { devta: 'Aryama', zone: 'E', energy: 'positive', color: '#FFD700' },
    { devta: 'Aditya', zone: 'E', energy: 'positive', color: '#FFC125' }, // Golden Yellow
  ],
  // Row 5
  [
    { devta: 'Pushpdant', zone: 'W', energy: 'positive', color: '#FFD700' }, // Gold
    { devta: 'Mitra', zone: 'W', energy: 'positive', color: '#FFD700' }, // Merged continues - Gold
    { devta: 'Mitra', zone: 'W', energy: 'positive', color: '#FFD700' },
    { devta: 'Brahma', zone: 'BRAHMASTHAN', energy: 'divine', color: '#FFD700' }, // Merged continues - Pure Gold
    { devta: 'Brahma', zone: 'BRAHMASTHAN', energy: 'divine', color: '#FFD700' },
    { devta: 'Brahma', zone: 'BRAHMASTHAN', energy: 'divine', color: '#FFD700' },
    { devta: 'Aryama', zone: 'E', energy: 'positive', color: '#FFD700' }, // Merged continues - Gold
    { devta: 'Aryama', zone: 'E', energy: 'positive', color: '#FFD700' },
    { devta: 'Satyak', zone: 'ESE', energy: 'positive', color: '#FFC125' }, // Golden Yellow
  ],
  // Row 6
  [
    { devta: 'Sugreev', zone: 'WSW', energy: 'neutral', color: '#F7E7CE' }, // Champagne (pastel)
    { devta: 'Indraraj', zone: 'W', energy: 'positive', color: '#FFD700' }, // Merged 2 cols - Gold
    { devta: 'Indraraj', zone: 'W', energy: 'positive', color: '#FFD700' },
    { devta: 'Vivasvan', zone: 'S', energy: 'positive', color: '#FFBF00' }, // Merged 3x2 - Amber
    { devta: 'Vivasvan', zone: 'S', energy: 'positive', color: '#FFBF00' },
    { devta: 'Vivasvan', zone: 'S', energy: 'positive', color: '#FFBF00' },
    { devta: 'Svitra', zone: 'SSE', energy: 'positive', color: '#FFD700' }, // Merged 2 cols - Gold
    { devta: 'Svitra', zone: 'SSE', energy: 'positive', color: '#FFD700' },
    { devta: 'Bhusha', zone: 'SE', energy: 'neutral', color: '#FFE87C' }, // Light Gold
  ],
  // Row 7
  [
    { devta: 'Dauwarik', zone: 'WSW', energy: 'neutral', color: '#FFE87C' }, // Light Gold
    { devta: 'Indra', zone: 'SW', energy: 'neutral', color: '#FFE87C' }, // Merged 2 cols - Light Gold
    { devta: 'Indra', zone: 'SW', energy: 'neutral', color: '#FFE87C' },
    { devta: 'Vivasvan', zone: 'S', energy: 'positive', color: '#FFBF00' }, // Merged continues - Amber
    { devta: 'Vivasvan', zone: 'S', energy: 'positive', color: '#FFBF00' },
    { devta: 'Vivasvan', zone: 'S', energy: 'positive', color: '#FFBF00' },
    { devta: 'Savitra', zone: 'SSE', energy: 'positive', color: '#FFC125' }, // Merged 2 cols - Golden Yellow
    { devta: 'Savitra', zone: 'SSE', energy: 'positive', color: '#FFC125' },
    { devta: 'Antrix', zone: 'SE', energy: 'neutral', color: '#FFE87C' }, // Light Gold
  ],
  // Row 8 (South - bottom row)
  [
    { devta: 'Pitru', zone: 'SW', energy: 'negative', color: '#F0A500' }, // Honey Gold
    { devta: 'Mrig', zone: 'SSW', energy: 'neutral', color: '#FFE87C' }, // Light Gold
    { devta: 'Bhujang', zone: 'SSW', energy: 'negative', color: '#F0A500' }, // Honey Gold
    { devta: 'Gandharva', zone: 'S', energy: 'neutral', color: '#FFF8DC' }, // Cornsilk (pastel)
    { devta: 'Yama', zone: 'S', energy: 'negative', color: '#FFDB58' }, // Mustard (pastel)
    { devta: 'Gkhawat', zone: 'S', energy: 'neutral', color: '#FFF8DC' }, // Cornsilk (pastel)
    { devta: 'Vitath', zone: 'SSE', energy: 'neutral', color: '#FFC125' }, // Golden Yellow
    { devta: 'Pusha', zone: 'SSE', energy: 'positive', color: '#FFC125' }, // Golden Yellow
    { devta: 'Agni', zone: 'SE', energy: 'positive', color: '#FFD700' }, // Gold
  ],
];

/**
 * Get Brahmasthan cells (center 9 cells - Brahma)
 */
export function getBrahmasthanCells() {
  const cells = [];
  for (let row = 3; row <= 5; row++) {
    for (let col = 3; col <= 5; col++) {
      cells.push({ row, col });
    }
  }
  return cells;
}

/**
 * Get zone color - Premium Golden/Yellow Palette
 */
export function getZoneColor(zone) {
  const zoneColors = {
    'NE': '#DAA520',  // Goldenrod - Most auspicious
    'N': '#FFC125',   // Golden Yellow
    'E': '#FFC125',   // Golden Yellow
    'SE': '#FFD700',  // Pure Gold
    'S': '#FFBF00',   // Amber
    'SW': '#F0A500',  // Honey Gold - Less auspicious
    'W': '#FFD700',   // Gold
    'NW': '#FFE87C',  // Light Gold
    'CENTER': '#FFD700', // Pure Gold
    'BRAHMASTHAN': '#FFD700', // Pure Gold - Sacred center
  };
  
  return zoneColors[zone] || '#FFE87C'; // Default to Light Gold
}

/**
 * Get energy level description
 */
export function getEnergyDescription(energy) {
  const descriptions = {
    'divine': 'Divine Energy - Sacred Center',
    'very positive': 'Very Positive - Highly Auspicious',
    'positive': 'Positive Energy - Auspicious',
    'neutral': 'Neutral Energy',
    'negative': 'Negative Energy - Avoid Heavy Activities',
  };
  
  return descriptions[energy] || 'Unknown';
}

/**
 * Get zone recommendations
 */
export function getZoneRecommendations(zone) {
  const recommendations = {
    'NE': 'Water bodies, worship room, entrance. Keep light and clean.',
    'N': 'Safe, treasury, study room. Good for finance and career.',
    'E': 'Bathrooms, living room, open spaces. Auspicious for beginnings.',
    'SE': 'Kitchen, electrical appliances. Fire element zone.',
    'S': 'Bedroom, heavy storage. Moderate activities.',
    'SW': 'Master bedroom, heavy storage. Keep heavy and elevated.',
    'W': 'Dining, study, children room. Moderate to good.',
    'NW': 'Guest room, garage. Temporary activities.',
    'BRAHMASTHAN': 'Keep open, light, and clutter-free. No pillars or heavy structures.',
  };
  
  return recommendations[zone] || 'General use area';
}

/**
 * Get devta name for a cell (handles merged cells)
 */
export function getDevtaName(row, col) {
  if (row < 0 || row >= 9 || col < 0 || col >= 9) return null;
  const cell = VASTU_GRID_9X9[row][col];
  return cell && cell.devta ? cell.devta : null;
}
