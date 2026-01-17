import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive sizing - matching HTML: width: 90vmin, max-width: 800px
const getGridSize = () => {
  const vmin = Math.min(SCREEN_WIDTH, Dimensions.get('window').height || SCREEN_WIDTH) * 0.9;
  const maxSize = Math.min(vmin, 800);
  return maxSize;
};

const GRID_SIZE = getGridSize();
const CELL_SIZE = GRID_SIZE / 9;

// Exact cell names from HTML - matching the order and structure
const CELLS = [
  // Row 0 (top row)
  { row: 0, col: 0, text: 'Rog' },
  { row: 0, col: 1, text: 'Nag' },
  { row: 0, col: 2, text: 'Mukhya' },
  { row: 0, col: 3, text: 'Bhalla' },
  { row: 0, col: 4, text: 'Soma' },
  { row: 0, col: 5, text: 'Bhujang' },
  { row: 0, col: 6, text: 'Aditi' },
  { row: 0, col: 7, text: 'Diti' },
  { row: 0, col: 8, text: 'Shikhi' },
  
  // Row 1
  { row: 1, col: 0, text: 'Papa Yaksha' },
  // RUDRAJAY spans rows 1-2, col 1 (span-2-col in HTML but actually spans 2 rows)
  { row: 1, col: 2, text: null }, // Empty cell
  // BHOODHAR spans rows 1-3, cols 3-5 (north-block: span 3 cols, span 2 rows)
  // AAP spans row 1, cols 6-7 (span-2-col)
  { row: 1, col: 8, text: 'Parjanya' },
  
  // Row 2
  { row: 2, col: 0, text: 'Sosha' },
  // RUDRAJAY continues
  { row: 2, col: 2, text: 'Rudra' },
  // BHOODHAR continues
  // AAPVATSA spans row 2, cols 6-7 (span-2-col)
  { row: 2, col: 8, text: 'Jayanta' },
  
  // Row 3
  { row: 3, col: 0, text: 'Asura' },
  // MITRA spans rows 3-5, cols 1-2 (west-block: span 2 cols, span 3 rows)
  // BRAHMA spans rows 3-5, cols 3-5 (center-block: span 3 cols, span 3 rows)
  // ARYAMA spans rows 3-5, cols 6-7 (east-block: span 2 cols, span 3 rows)
  { row: 3, col: 8, text: 'Mahendra' },
  
  // Row 4
  { row: 4, col: 0, text: 'Varuna' },
  // MITRA continues
  // BRAHMA continues
  // ARYAMA continues
  { row: 4, col: 8, text: 'Surya' },
  
  // Row 5
  { row: 5, col: 0, text: 'Pushpadanta' },
  // MITRA continues
  // BRAHMA continues
  // ARYAMA continues
  { row: 5, col: 8, text: 'Satya' },
  
  // Row 6
  { row: 6, col: 0, text: 'Sugriva' },
  // INDRARAJ spans row 6, cols 1-2 (span-2-col)
  // VIVASWAN spans rows 6-7, cols 3-5 (south-block: span 3 cols, span 2 rows)
  // SVITRA spans row 6, cols 6-7 (span-2-col)
  { row: 6, col: 8, text: 'Bhrusha' },
  
  // Row 7
  { row: 7, col: 0, text: 'Dwarika' },
  // INDRA spans row 7, cols 1-2 (span-2-col)
  // VIVASWAN continues
  // SAVITRA spans row 7, cols 6-7 (span-2-col)
  { row: 7, col: 8, text: 'Aakash' },
  
  // Row 8 (bottom row)
  { row: 8, col: 0, text: 'Pitru Gana' },
  { row: 8, col: 1, text: 'Mriga' },
  { row: 8, col: 2, text: 'Bhringaraj' },
  { row: 8, col: 3, text: 'Gandharva' },
  { row: 8, col: 4, text: 'Yama' },
  { row: 8, col: 5, text: 'Bhratsata' },
  { row: 8, col: 6, text: 'Vitath' },
  { row: 8, col: 7, text: 'Pusha' },
  { row: 8, col: 8, text: 'Agni' },
];

// Merged cells - matching image description exactly (1-indexed converted to 0-indexed)
const MERGED_CELLS = [
  // RUDRAJAY - spans (2,2) to (3,2) in image = rows 1-2, col 1 (2 rows, 1 col)
  { row: 1, col: 1, rowSpan: 2, colSpan: 1, text: 'Rudrajay' },
  // BHOODHAR - north-block: grid-column: span 3; grid-row: span 2; = rows 1-2, cols 3-5 (2 rows, 3 cols)
  { row: 1, col: 3, rowSpan: 2, colSpan: 3, text: 'Prithvidhara' },
  // AAP - spans (2,7) to (2,8) in image = row 1, cols 6-7 (1 row, 2 cols)
  { row: 1, col: 6, rowSpan: 1, colSpan: 2, text: 'Aap' },
  // AAPVATSA - spans (3,7) to (3,8) in image = row 2, cols 6-7 (1 row, 2 cols)
  { row: 2, col: 6, rowSpan: 1, colSpan: 2, text: 'Aapvatsa' },
  // MITRA - spans (4,2) to (6,3) in image = rows 3-5, cols 1-2 (3 rows, 2 cols)
  { row: 3, col: 1, rowSpan: 3, colSpan: 2, text: 'Mitra' },
  // BRAHMA - spans (4,4) to (6,6) in image = rows 3-5, cols 3-5 (3 rows, 3 cols)
  { row: 3, col: 3, rowSpan: 3, colSpan: 3, text: 'Brahma' },
  // ARYAMA - spans (4,7) to (6,8) in image = rows 3-5, cols 6-7 (3 rows, 2 cols)
  { row: 3, col: 6, rowSpan: 3, colSpan: 2, text: 'Aryama' },
  // INDRARAJ - spans (7,2) to (7,3) in image = row 6, cols 1-2 (1 row, 2 cols)
  { row: 6, col: 1, rowSpan: 1, colSpan: 2, text: 'Indraraj' },
  // VIVASWAN - spans (7,4) to (8,6) in image = rows 6-7, cols 3-5 (2 rows, 3 cols) - matching HTML south-block
  { row: 6, col: 3, rowSpan: 2, colSpan: 3, text: 'Vivaswan' },
  // SVITRA - spans (7,7) to (7,8) in image = row 6, cols 6-7 (1 row, 2 cols)
  { row: 6, col: 6, rowSpan: 1, colSpan: 2, text: 'Svitra' },
  // INDRA - spans (8,2) to (8,3) in image = row 7, cols 1-2 (1 row, 2 cols)
  { row: 7, col: 1, rowSpan: 1, colSpan: 2, text: 'Indra' },
  // SAVITRA - spans (8,7) to (8,8) in image = row 7, cols 6-7 (1 row, 2 cols)
  { row: 7, col: 6, rowSpan: 1, colSpan: 2, text: 'Savitra' },
];

export default function VastuPurushaMandalaGrid() {
  // Create a set of occupied positions by merged cells
  const getOccupiedPositions = () => {
    const occupied = new Set();
    MERGED_CELLS.forEach(cell => {
      for (let r = cell.row; r < cell.row + cell.rowSpan; r++) {
        for (let c = cell.col; c < cell.col + cell.colSpan; c++) {
          occupied.add(`${r}-${c}`);
        }
      }
    });
    return occupied;
  };

  const occupiedPositions = getOccupiedPositions();

  // Render individual cells (non-merged)
  const renderIndividualCells = () => {
    return CELLS.map(cell => {
      const key = `${cell.row}-${cell.col}`;
      
      // Skip if this position is occupied by a merged cell
      if (occupiedPositions.has(key)) {
        return null;
      }
      
      // Skip if text is null
      if (!cell.text) {
        return null;
      }
      
      // Special font size for longer text (matching HTML: font-size: clamp(0.6rem, 1.5vmin, 1rem))
      const baseFontSize = CELL_SIZE * 0.12;
      const fontSize = cell.text.length > 8 ? baseFontSize * 0.8 : baseFontSize;
      
      return (
        <View
          key={key}
          style={[
            styles.cell,
            {
              position: 'absolute',
              left: cell.col * CELL_SIZE,
              top: cell.row * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            },
          ]}
        >
          <Text style={[styles.cellText, { fontSize }]}>
            {cell.text}
          </Text>
        </View>
      );
    });
  };

  // Render merged cells
  const renderMergedCells = () => {
    return MERGED_CELLS.map((cell, index) => {
      const width = cell.colSpan * CELL_SIZE;
      const height = cell.rowSpan * CELL_SIZE;
      const left = cell.col * CELL_SIZE;
      const top = cell.row * CELL_SIZE;
      
      // Special styling matching HTML
      const isCenter = cell.text === 'Brahma';
      const isSouth = cell.text === 'Vivaswan';
      
      // Font size: center uses clamp(0.8rem, 2vmin, 1.2rem), others use clamp(0.6rem, 1.5vmin, 1rem)
      const baseFontSize = isCenter ? CELL_SIZE * 0.2 : CELL_SIZE * 0.12;
      
      return (
        <View
          key={`merged-${index}`}
          style={[
            styles.mergedCell,
            {
              position: 'absolute',
              left,
              top,
              width,
              height,
            },
            isCenter && styles.centerBlock,
            isSouth && styles.southBlock,
          ]}
        >
          <Text style={[
            styles.cellText,
            isCenter && styles.centerText,
            { fontSize: baseFontSize }
          ]}>
            {cell.text}
          </Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.gridContainer, { width: GRID_SIZE, height: GRID_SIZE }]}>
        {/* Individual cells */}
        {renderIndividualCells()}
        
        {/* Merged cells */}
        {renderMergedCells()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    margin: 0,
  },
  gridContainer: {
    backgroundColor: 'white',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#0f5257',
    position: 'relative',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#0f5257',
    padding: 2,
  },
  mergedCell: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#0f5257',
    padding: 2,
  },
  centerBlock: {
    // Center Brahma - matching HTML
  },
  southBlock: {
    alignItems: 'flex-end', // HTML: align-items: flex-end; padding-bottom: 20px;
    paddingBottom: 20,
  },
  cellText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#000',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? "'DM Sans', sans-serif" : 'System',
  },
  centerText: {
    // Larger text for center Brahma
  },
});
