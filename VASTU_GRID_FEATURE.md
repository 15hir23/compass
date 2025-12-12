# Vastu Grid Feature - Implementation Guide

## ✅ What's Been Implemented

### 1. **Core Utilities** (`utils/mapUtils.js`)
Complete set of mathematical functions for map operations:
- ✅ `latLngToXY()` - Convert GPS coordinates to local meters
- ✅ `xyToLatLng()` - Convert back to GPS
- ✅ `averageCenter()` - Calculate plot center
- ✅ `sortCornersAsRect()` - Order corners as BL, BR, TR, TL
- ✅ `interpolate()` - Linear interpolation between points
- ✅ `createGridLinesXY()` - Generate 9×9 grid lines
- ✅ `getCellCenterXY()` - Get center of any cell
- ✅ `getCellCornersXY()` - Get all 4 corners of any cell
- ✅ `getPlotAngle()` - Calculate plot orientation
- ✅ `rotateGridForHeading()` - Align grid with magnetic North

### 2. **Vastu Purusha Mandala** (`utils/vastuGrid.js`)
Complete 9×9 grid with all 81 padas:
- ✅ Full devta mapping for all 81 cells
- ✅ Zone assignments (NE, N, E, SE, S, SW, W, NW, CENTER, BRAHMASTHAN)
- ✅ Energy levels (divine, very positive, positive, neutral, negative)
- ✅ Color coding for each cell
- ✅ `getBrahmasthanCells()` - Returns center 9 sacred cells
- ✅ `getZoneColor()` - Get color for any zone
- ✅ `getEnergyDescription()` - Energy level descriptions
- ✅ `getZoneRecommendations()` - Vastu guidance for each zone

### 3. **Device-Specific Compass Fixes**
- ✅ Universal compass that works on iOS, Android, Samsung
- ✅ Special Pixel device calibration (inverted axes, 90° correction)
- ✅ Enhanced smoothing to prevent jitter
- ✅ Auto cache clearance on reload

## 🚧 Next Steps: Integration with MapViewModal

### Step 1: Add Plot Corner Selection

Add to `MapViewModal.js`:
```javascript
const [plotCorners, setPlotCorners] = useState([]);
const [showVastuGrid, setShowVastuGrid] = useState(false);

// For Web (Leaflet)
const handleMapClick = (e) => {
  if (plotCorners.length >= 4) return;
  const newCorner = {
    latitude: e.latlng.lat,
    longitude: e.latlng.lng
  };
  setPlotCorners([...plotCorners, newCorner]);
};

// Add to map initialization:
googleMapRef.current.on('click', handleMapClick);
```

### Step 2: Render Grid Lines

```javascript
import {
  latLngToXY,
  xyToLatLng,
  averageCenter,
  sortCornersAsRect,
  createGridLinesXY
} from '../utils/mapUtils';

// After 4 corners are marked:
if (plotCorners.length === 4) {
  const center = averageCenter(plotCorners);
  const xyCorners = plotCorners.map(p => latLngToXY(center, p));
  const rectXY = sortCornersAsRect(xyCorners);
  const { verticalLines, horizontalLines } = createGridLinesXY(rectXY);
  
  // Draw lines on Leaflet:
  verticalLines.forEach((line, i) => {
    const latLngs = line.map(p => [
      xyToLatLng(center, p.x, p.y).latitude,
      xyToLatLng(center, p.x, p.y).longitude
    ]);
    window.L.polyline(latLngs, {
      color: '#F4C430',
      weight: 2,
      opacity: 0.8
    }).addTo(googleMapRef.current);
  });
  
  // Same for horizontalLines
}
```

### Step 3: Add Devta Labels

```javascript
import { VASTU_GRID_9X9, getBrahmasthanCells } from '../utils/vastuGrid';
import { getCellCenterXY } from '../utils/mapUtils';

// For each cell:
for (let row = 0; row < 9; row++) {
  for (let col = 0; col < 9; col++) {
    const devtaInfo = VASTU_GRID_9X9[row][col];
    const cellCenter = getCellCenterXY(rectXY, row, col);
    const coord = xyToLatLng(center, cellCenter.x, cellCenter.y);
    
    // Create custom marker:
    const devtaIcon = window.L.divIcon({
      className: 'devta-label',
      html: `<div style="
        background: ${devtaInfo.color}AA;
        color: white;
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
      ">${devtaInfo.devta}</div>`,
      iconSize: [null, null],
      iconAnchor: [0, 0]
    });
    
    window.L.marker([coord.latitude, coord.longitude], {
      icon: devtaIcon
    }).addTo(googleMapRef.current);
  }
}
```

### Step 4: Highlight Brahmasthan

```javascript
import { getBrahmasthanCells, getCellCornersXY } from '../utils';

const brahmasth anCells = getBrahmasthanCells();

brahmasthancells.forEach(({ row, col }) => {
  const corners = getCellCornersXY(rectXY, row, col);
  const latLngs = corners.map(p => {
    const coord = xyToLatLng(center, p.x, p.y);
    return [coord.latitude, coord.longitude];
  });
  
  window.L.polygon(latLngs, {
    color: '#FFA500',
    fillColor: '#FFA500',
    fillOpacity: 0.3,
    weight: 3
  }).addTo(googleMapRef.current);
});
```

### Step 5: Align with Compass Heading

```javascript
import { rotateGridForHeading, getPlotAngle } from '../utils/mapUtils';

const plotAngle = getPlotAngle(center, plotCorners);
const northAngle = (heading * Math.PI) / 180; // From compass

const rotatedGrid = rotateGridForHeading(
  VASTU_GRID_9X9,
  plotAngle,
  northAngle
);

// Now use rotatedGrid instead of VASTU_GRID_9X9
```

## 📋 UI Controls to Add

### Corner Selection Mode
```javascript
const [cornerSelectionMode, setCornerSelectionMode] = useState(false);

<TouchableOpacity
  style={styles.mapControlButton}
  onPress={() => setCornerSelectionMode(!cornerSelectionMode)}
>
  <Text>📍 Mark Plot (Step {plotCorners.length + 1}/4)</Text>
</TouchableOpacity>
```

### Clear Grid Button
```javascript
<TouchableOpacity
  onPress={() => {
    setPlotCorners([]);
    // Remove all polylines and markers from map
  }}
>
  <Text>🗑️ Clear Grid</Text>
</TouchableOpacity>
```

### Toggle Labels
```javascript
const [showDevtaLabels, setShowDevtaLabels] = useState(true);
const [showZones, setShowZones] = useState(true);
const [highlightBrahmasthan, setHighlightBrahmasthan] = useState(true);
```

## 🎨 Styling Recommendations

### Grid Lines
- Color: `#F4C430` (Golden)
- Weight: 2
- Opacity: 0.8

### Brahmasthan
- Fill: `#FFA500` (Orange)
- Fill Opacity: 0.3
- Border: 3px solid `#FFA500`

### Zone Colors (from vastuGrid.js)
- NE (Most auspicious): `#4169E1` (Royal Blue)
- N: `#87CEEB` (Sky Blue)
- E: `#90EE90` (Light Green)
- SE: `#FFD700` (Gold)
- S: `#FFA500` (Orange)
- SW (Least auspicious): `#8B4513` (Saddle Brown)
- W: `#CD853F` (Peru)
- NW: `#A0522D` (Sienna)

## 📱 User Flow

1. **User opens Map View** →  Sees compass overlay
2. **User taps "Mark Plot" button** → Enters corner selection mode
3. **User long-presses 4 corners** → Red markers appear
4. **After 4th corner** → Grid automatically renders
5. **User can toggle**:
   - Show/hide devta labels
   - Show/hide zone colors
   - Highlight Brahmasthan
   - Rotate grid to align with North
6. **User can download** → Screenshot with grid + compass

## 🔧 Technical Notes

### Coordinate Systems
- **GPS**: latitude/longitude (WGS84)
- **Local XY**: meters relative to plot center
- **Grid**: 0-8 rows/cols (9×9 cells)

### Grid Orientation
- Row 0 = South (bottom)
- Row 8 = North (top)
- Col 0 = West (left)
- Col 8 = East (right)

### Rotation
- Plot angle vs. magnetic North
- Auto-rotates devta matrix to match
- Uses compass heading for alignment

### Performance
- Calculate grid once, store reference
- Only redraw on corner change
- Use layer groups for easy show/hide

## 🐛 Potential Issues & Solutions

### Issue: Grid not aligned with plot
**Solution**: Ensure corners are marked clockwise starting from bottom-left

### Issue: Devtas appear upside down
**Solution**: Check rotation logic, may need to invert row indexing

### Issue: Map performance slow with 81 markers
**Solution**: Use canvas overlay or cluster markers, hide labels on zoom out

### Issue: Brahmasthan not centered
**Solution**: Verify cells (3,3) to (5,5) are correct in grid

## 📚 References

- Vastu Purusha Mandala: 81 Padas system
- Brahmasthan: Sacred center (9 cells)
- Devtas: 45 deities mapped to grid
- Zones: 8 cardinal + center

## ✨ Future Enhancements

- [ ] 3D visualization of energy levels
- [ ] Color gradient based on auspiciousness
- [ ] Recommendations for room placement
- [ ] Export as PDF with annotations
- [ ] Save multiple plots
- [ ] Comparison tool for multiple plots
- [ ] Integration with architectural plans
- [ ] AR overlay for on-site visualization

---

**Status**: Core utilities complete ✅  
**Next**: Integrate with MapViewModal component  
**ETA**: ~2-3 hours for full integration

