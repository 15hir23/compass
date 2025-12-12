// EXACT GRID STRUCTURE matching HTML/React design
// This defines the 9x9 Vastu grid with proper cell spanning for each devta

/**
 * Determine which layer a devta belongs to
 * @param {string} devtaName - Name of the devta
 * @param {number} row - Row position (0-8)
 * @param {number} col - Column position (0-8)
 * @returns {string} - 'outer', 'middle', or 'center'
 */
function getDevtaLayer(devtaName, row, col) {
  // Center layer - Brahma in center 3x3 (rows 3-5, cols 3-5)
  if (devtaName === 'Brahma') {
    return 'center';
  }
  
  // Outer layer - perimeter cells (row 0, row 8, col 0, col 8)
  if (row === 0 || row === 8 || col === 0 || col === 8) {
    return 'outer';
  }
  
  // Middle layer - everything else (rows 1-7, cols 1-7, excluding center)
  return 'middle';
}

export const GRID_STRUCTURE = [
  // Row 0
  { name: 'Vayu', row: 0, col: 0, rowSpan: 1, colSpan: 1 },
  { name: 'Naag', row: 0, col: 1, rowSpan: 1, colSpan: 1 },
  { name: 'Mukhya', row: 0, col: 2, rowSpan: 1, colSpan: 1 },
  { name: 'Bhallat', row: 0, col: 3, rowSpan: 1, colSpan: 1 },
  { name: 'Som', row: 0, col: 4, rowSpan: 1, colSpan: 1 },
  { name: 'Charak', row: 0, col: 5, rowSpan: 1, colSpan: 1 },
  { name: 'Aditi', row: 0, col: 6, rowSpan: 1, colSpan: 1 },
  { name: 'Uditi', row: 0, col: 7, rowSpan: 1, colSpan: 1 },
  { name: 'Isha', row: 0, col: 8, rowSpan: 1, colSpan: 1 },
  
  // Row 1
  { name: 'Rog', row: 1, col: 0, rowSpan: 1, colSpan: 1 },
  { name: 'Rudrajay', row: 1, col: 1, rowSpan: 1, colSpan: 2 },
  { name: 'Bhoodhar', row: 1, col: 3, rowSpan: 2, colSpan: 3 },
  { name: 'Aap', row: 1, col: 6, rowSpan: 1, colSpan: 2 },
  { name: 'Parjanya', row: 1, col: 8, rowSpan: 1, colSpan: 1 },
  
  // Row 2
  { name: 'Sosh', row: 2, col: 0, rowSpan: 1, colSpan: 1 },
  { name: 'Rudra', row: 2, col: 1, rowSpan: 1, colSpan: 2 },
  { name: 'Aapvatsa', row: 2, col: 6, rowSpan: 1, colSpan: 2 },
  { name: 'Jayant', row: 2, col: 8, rowSpan: 1, colSpan: 1 },
  
  // Row 3
  { name: 'Asur', row: 3, col: 0, rowSpan: 1, colSpan: 1 },
  { name: 'Mitra', row: 3, col: 1, rowSpan: 3, colSpan: 2 },
  { name: 'Brahma', row: 3, col: 3, rowSpan: 3, colSpan: 3 },
  { name: 'Aryama', row: 3, col: 6, rowSpan: 3, colSpan: 2 },
  { name: 'Mahendra', row: 3, col: 8, rowSpan: 1, colSpan: 1 },
  
  // Row 4
  { name: 'Varun', row: 4, col: 0, rowSpan: 1, colSpan: 1 },
  { name: 'Aditya', row: 4, col: 8, rowSpan: 1, colSpan: 1 },
  
  // Row 5
  { name: 'Pushpdant', row: 5, col: 0, rowSpan: 1, colSpan: 1 },
  { name: 'Satyak', row: 5, col: 8, rowSpan: 1, colSpan: 1 },
  
  // Row 6
  { name: 'Sugreev', row: 6, col: 0, rowSpan: 1, colSpan: 1 },
  { name: 'Indraraj', row: 6, col: 1, rowSpan: 1, colSpan: 2 },
  { name: 'Vivasvan', row: 6, col: 3, rowSpan: 2, colSpan: 3 },
  { name: 'Svitra', row: 6, col: 6, rowSpan: 1, colSpan: 2 },
  { name: 'Bhusha', row: 6, col: 8, rowSpan: 1, colSpan: 1 },
  
  // Row 7
  { name: 'Dauwarik', row: 7, col: 0, rowSpan: 1, colSpan: 1 },
  { name: 'Indra', row: 7, col: 1, rowSpan: 1, colSpan: 2 },
  { name: 'Savitra', row: 7, col: 6, rowSpan: 1, colSpan: 2 },
  { name: 'Antrix', row: 7, col: 8, rowSpan: 1, colSpan: 1 },
  
  // Row 8
  { name: 'Pitru', row: 8, col: 0, rowSpan: 1, colSpan: 1 },
  { name: 'Mrig', row: 8, col: 1, rowSpan: 1, colSpan: 1 },
  { name: 'Bhujang', row: 8, col: 2, rowSpan: 1, colSpan: 1 },
  { name: 'Gandharva', row: 8, col: 3, rowSpan: 1, colSpan: 1 },
  { name: 'Yama', row: 8, col: 4, rowSpan: 1, colSpan: 1 },
  { name: 'Gkhawat', row: 8, col: 5, rowSpan: 1, colSpan: 1 },
  { name: 'Vitath', row: 8, col: 6, rowSpan: 1, colSpan: 1 },
  { name: 'Pusha', row: 8, col: 7, rowSpan: 1, colSpan: 1 },
  { name: 'Agni', row: 8, col: 8, rowSpan: 1, colSpan: 1 },
];

/**
 * Draw Vastu Grid on Leaflet map with VISIBLE cell size differentiation
 */
export const drawVastuGrid = ({
  mapRef,
  plotCorners,
  gridLayersRef,
  cornerMarkersRef,
  showOuterLayer,
  showMiddleLayer,
  showCenterLayer,
  language,
  translateDevtaName,
  getBrahmasthanCells,
  VASTU_GRID_9X9,
  setShowVastuGrid,
  setShowGridBanner,
}) => {
  try {
    if (!mapRef || plotCorners.length !== 4 || !window.L) {
      return;
    }
    
    const currentLang = language || 'en';
    
    // Clear previous grid (keep corner markers)
    gridLayersRef.forEach(layer => {
      if (mapRef && layer && !cornerMarkersRef.includes(layer)) {
        try {
          mapRef.removeLayer(layer);
        } catch (e) {}
      }
    });
    gridLayersRef.length = 0;
    gridLayersRef.push(...cornerMarkersRef.filter(l => l));
    
    // Helper function for bilinear interpolation
    const getGridPoint = (row, col) => {
      const rowT = row / 9;
      const colT = col / 9;
      
      const bl = plotCorners[0];
      const br = plotCorners[1];
      const tr = plotCorners[2];
      const tl = plotCorners[3];
      
      const bottomLat = bl.latitude + (br.latitude - bl.latitude) * colT;
      const bottomLng = bl.longitude + (br.longitude - bl.longitude) * colT;
      
      const topLat = tl.latitude + (tr.latitude - tl.latitude) * colT;
      const topLng = tl.longitude + (tr.longitude - tl.longitude) * colT;
      
      const lat = bottomLat + (topLat - bottomLat) * rowT;
      const lng = bottomLng + (topLng - bottomLng) * rowT;
      
      return { lat, lng };
    };
    
    // 1. Draw plot outline
    const plotOutline = plotCorners.map(p => [p.latitude, p.longitude]);
    const outline = window.L.polygon([...plotOutline, plotOutline[0]], {
      color: '#0f5257',
      fillColor: 'transparent',
      weight: 4,
      opacity: 1,
    }).addTo(mapRef);
    gridLayersRef.push(outline);
    
    // 2. Draw light background grid (9x9) - VERY SUBTLE
    for (let i = 0; i <= 9; i++) {
      const bottom = getGridPoint(0, i);
      const top = getGridPoint(9, i);
      
      const vLine = window.L.polyline(
        [[bottom.lat, bottom.lng], [top.lat, top.lng]], 
        {
          color: '#0f5257',
          weight: 0.5,
          opacity: 0.2,
          dashArray: '2, 3'
        }
      ).addTo(mapRef);
      gridLayersRef.push(vLine);
      
      const left = getGridPoint(i, 0);
      const right = getGridPoint(i, 9);
      
      const hLine = window.L.polyline(
        [[left.lat, left.lng], [right.lat, right.lng]], 
        {
          color: '#0f5257',
          weight: 0.5,
          opacity: 0.2,
          dashArray: '2, 3'
        }
      ).addTo(mapRef);
      gridLayersRef.push(hLine);
    }
    
    // 3. Draw ACTUAL CELL BOUNDARIES with thick lines + colored backgrounds
    // Filter by layer visibility
    GRID_STRUCTURE.forEach(cell => {
      const cellLayer = getDevtaLayer(cell.name, cell.row, cell.col);
      
      // Skip if this layer is not visible
      if (cellLayer === 'outer' && !showOuterLayer) return;
      if (cellLayer === 'middle' && !showMiddleLayer) return;
      if (cellLayer === 'center' && !showCenterLayer) return;
      
      // Get all 4 corners of the spanned cell
      const bl = getGridPoint(cell.row, cell.col);
      const br = getGridPoint(cell.row, cell.col + cell.colSpan);
      const tr = getGridPoint(cell.row + cell.rowSpan, cell.col + cell.colSpan);
      const tl = getGridPoint(cell.row + cell.rowSpan, cell.col);
      
      // Get devta info for coloring
      const devtaInfo = VASTU_GRID_9X9[cell.row]?.[cell.col] || { 
        devta: cell.name, 
        zone: '', 
        energy: 'neutral', 
        color: '#87CEEB' 
      };
      
      // Determine border thickness based on cell size
      let borderWeight = 2;
      const spanFactor = cell.rowSpan + cell.colSpan;
      if (cell.name === 'Brahma') borderWeight = 4;
      else if (spanFactor > 3) borderWeight = 3;
      
      // Draw cell with THICK colored border and subtle background
      const cellPolygon = window.L.polygon([
        [bl.lat, bl.lng],
        [br.lat, br.lng],
        [tr.lat, tr.lng],
        [tl.lat, tl.lng],
      ], {
        color: devtaInfo.color,
        fillColor: devtaInfo.color,
        fillOpacity: 0.2, // More visible background
        weight: borderWeight,
        opacity: 0.8,
      }).addTo(mapRef);
      gridLayersRef.push(cellPolygon);
    });
    
    // 4. Highlight Brahmasthan with premium golden color
    if (showCenterLayer) {
      const brahmasthanCells = getBrahmasthanCells();
      
      brahmasthanCells.forEach(({ row, col }) => {
        const bl = getGridPoint(row, col);
        const br = getGridPoint(row, col + 1);
        const tr = getGridPoint(row + 1, col + 1);
        const tl = getGridPoint(row + 1, col);
        
        const polygon = window.L.polygon([
          [bl.lat, bl.lng],
          [br.lat, br.lng],
          [tr.lat, tr.lng],
          [tl.lat, tl.lng],
        ], {
          color: '#DAA520', // Premium Goldenrod
          fillColor: '#FFD700', // Pure Gold
          fillOpacity: 0.4,
          weight: 3,
          opacity: 0.9,
        }).addTo(mapRef);
        gridLayersRef.push(polygon);
      });
    }
    
    // 5. Draw devta labels with hierarchical sizing
    // Filter by layer visibility
    GRID_STRUCTURE.forEach(cell => {
      const cellLayer = getDevtaLayer(cell.name, cell.row, cell.col);
      
      // Skip if this layer is not visible
      if (cellLayer === 'outer' && !showOuterLayer) return;
      if (cellLayer === 'middle' && !showMiddleLayer) return;
      if (cellLayer === 'center' && !showCenterLayer) return;
      
      const centerRow = cell.row + (cell.rowSpan / 2);
      const centerCol = cell.col + (cell.colSpan / 2);
      
      const centerPoint = getGridPoint(centerRow, centerCol);
        
        const devtaInfo = VASTU_GRID_9X9[cell.row]?.[cell.col] || { 
          devta: cell.name, 
          zone: '', 
          energy: 'neutral', 
          color: '#87CEEB' 
        };
        
        const translatedDevtaName = translateDevtaName(cell.name, currentLang);
        
        // Hierarchical font sizing
        let fontSize = 9;
        let fontWeight = 'bold';
        let padding = '3px 7px';
        let borderRadius = '4px';
        let letterSpacing = '0.5px';
        
        const spanFactor = cell.rowSpan + cell.colSpan;
        
        if (cell.name === 'Brahma') {
          fontSize = 18;
          fontWeight = '900';
          padding = '6px 14px';
          borderRadius = '8px';
          letterSpacing = '2px';
        } else if (cell.name === 'Bhoodhar' || cell.name === 'Vivasvan') {
          fontSize = 14;
          fontWeight = '800';
          padding = '5px 11px';
          borderRadius = '6px';
          letterSpacing = '1px';
        } else if (cell.name === 'Mitra' || cell.name === 'Aryama') {
          fontSize = 13;
          fontWeight = '800';
          padding = '4px 10px';
          borderRadius = '6px';
          letterSpacing = '0.8px';
        } else if (spanFactor === 3) {
          fontSize = 11;
          fontWeight = '700';
          padding = '3px 8px';
          letterSpacing = '0.6px';
        } else if (cell.name === 'Pushpdant' || cell.name === 'Gandharva') {
          fontSize = 8;
          padding = '2px 5px';
          letterSpacing = '0.3px';
        }
        
        // Use dark text for better contrast on golden backgrounds
        const textColor = cell.name === 'Brahma' ? '#8B4513' : '#654321'; // Dark brown for premium look
        const borderColor = cell.name === 'Brahma' ? '#DAA520' : '#B8860B'; // Dark goldenrod border
        
        const devtaIcon = window.L.divIcon({
          className: 'devta-label',
          html: `<div style="
            background: ${devtaInfo.color}EE;
            color: ${textColor};
            padding: ${padding};
            border-radius: ${borderRadius};
            font-size: ${fontSize}px;
            font-weight: ${fontWeight};
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            white-space: nowrap;
            border: 2px solid ${borderColor};
            box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.5);
            text-align: center;
            text-transform: uppercase;
            letter-spacing: ${letterSpacing};
            display: inline-block;
          ">${translatedDevtaName}</div>`,
          iconSize: [null, null],
          iconAnchor: [0, 0]
        });
        
        const marker = window.L.marker([centerPoint.lat, centerPoint.lng], {
          icon: devtaIcon,
          zIndexOffset: 2000
        }).addTo(mapRef);
        
        marker.bindTooltip(`
          <div style="text-align: center; font-family: 'DM Sans', sans-serif; padding: 6px;">
            <strong style="font-size: 14px; color: #222;">${translatedDevtaName}</strong><br/>
            <span style="font-size: 12px; color: #666; font-weight: 600;">Size: ${cell.rowSpan}×${cell.colSpan}</span><br/>
            ${devtaInfo.zone ? `<span style="font-size: 11px; color: #555;">Zone: ${devtaInfo.zone}</span><br/>` : ''}
            <span style="font-size: 11px; color: #555;">Energy: ${devtaInfo.energy}</span>
          </div>
        `, { 
          direction: 'top',
          offset: [0, -8]
        });
        
        gridLayersRef.push(marker);
    });
    
    // Update state
    if (setShowVastuGrid) setShowVastuGrid(true);
    
    const gridBannerShown = typeof window !== 'undefined' && window.sessionStorage 
      ? window.sessionStorage.getItem('mapViewGridBannerShown') === 'true'
      : false;
    if (!gridBannerShown && setShowGridBanner) {
      setShowGridBanner(true);
    }
    
  } catch (error) {
    console.error('❌ Grid error:', error);
    alert('Error drawing grid: ' + error.message);
  }
};