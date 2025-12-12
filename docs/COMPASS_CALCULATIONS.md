# Compass Calculation Documentation

This document explains all the mathematical calculations and algorithms used in the compass implementation.

## Overview

The compass calculates the device's heading (direction) using:
1. **Magnetometer** - Detects Earth's magnetic field
2. **Accelerometer** - Detects device tilt/gravity (for tilt compensation)
3. **Low-Pass Filtering** - Smooths out sensor noise
4. **Stability Detection** - Prevents jitter when device is stationary

---

## 1. Core Heading Calculation

### Basic Formula (Device Flat)

When the device is held flat (no tilt):

```javascript
// Raw magnetometer readings: mx, my, mz
// Device coordinate system:
// - X-axis: points right (East)
// - Y-axis: points up (North when device points North)
// - Z-axis: points out of screen (upward)

// Calculate angle from North using atan2
let rawHeading = Math.atan2(mx, my) * (180 / Math.PI);

// Convert to standard compass (0° = North, clockwise)
heading = (360 - rawHeading) % 360;
```

**Why invert?** The device coordinate system and atan2 convention require inversion to match standard compass convention (North = 0°, clockwise).

### Tilt Compensation (Device Tilted)

When the device is tilted, we need to project the magnetic field onto the horizontal plane:

```javascript
// Step 1: Normalize accelerometer to get gravity vector
const accelMagnitude = Math.sqrt(ax² + ay² + az²);
const gx = ax / accelMagnitude;  // Normalized gravity X
const gy = ay / accelMagnitude;  // Normalized gravity Y
const gz = az / accelMagnitude;  // Normalized gravity Z

// Step 2: Calculate tilt angles
const pitch = Math.asin(-gx);     // Rotation around X-axis (forward/back tilt)
const roll = Math.asin(gy / cos(pitch));  // Rotation around Y-axis (left/right tilt)

// Step 3: Rotate magnetometer vector to horizontal plane
const sinPitch = Math.sin(pitch);
const cosPitch = Math.cos(pitch);
const sinRoll = Math.sin(roll);
const cosRoll = Math.cos(roll);

// Project magnetometer onto horizontal plane
const hx = mx * cosPitch + mz * sinPitch;
const hy = mx * sinRoll * sinPitch + my * cosRoll - mz * sinRoll * cosPitch;

// Step 4: Calculate heading from horizontal components
let rawHeading = Math.atan2(hx, hy) * (180 / Math.PI);
heading = (360 - rawHeading) % 360;
```

**What this does:** Projects the 3D magnetic field vector onto a 2D horizontal plane, compensating for device tilt.

---

## 2. Low-Pass Filtering

### Purpose
Smooths out sensor noise and jitter to provide stable readings.

### Algorithm

```javascript
class LowPassFilter {
  constructor(alpha = 0.15) {
    this.alpha = alpha;  // Smoothing factor (0-1, lower = smoother)
    this.value = null;   // Previous filtered value
  }

  filter(newValue) {
    if (this.value === null) {
      this.value = newValue;
      return newValue;
    }

    // Handle angle wraparound (359° -> 0°)
    let diff = newValue - this.value;
    if (diff > 180) diff -= 360;   // Wrap around
    if (diff < -180) diff += 360;

    // Exponential moving average
    this.value = this.value + this.alpha * diff;
    
    // Normalize to 0-360
    while (this.value < 0) this.value += 360;
    while (this.value >= 360) this.value -= 360;

    return this.value;
  }
}
```

### Formula
```
filtered_value = previous_value + α × (new_value - previous_value)
```

Where:
- **α (alpha)** = Smoothing factor
  - Default: `0.12` (12% of new value, 88% of old value)
  - Pixel devices: `0.08` (8% of new value, 92% of old value - more stable)
  - Lower α = smoother but slower response
  - Higher α = faster response but more jitter

### Wraparound Handling
Angles wrap around at 0°/360°, so we handle differences like:
- `359° → 1°` = difference of `2°` (not `-358°`)
- `1° → 359°` = difference of `-2°` (not `358°`)

---

## 3. Stability Detection & Dead Zone

### Purpose
Prevents the compass from jittering when the device is stationary (like a professional compass).

### Movement Detection

**For Native (Accelerometer):**
```javascript
// Calculate acceleration magnitude
const accel = Math.sqrt(x² + y² + z²);

// Calculate change in acceleration (jerk)
const jerk = |accel_new - accel_old| / time_delta;

// Detect movement
if (jerk > MOVEMENT_THRESHOLD || |accel - 9.81| > STATIONARY_ACCEL_THRESHOLD) {
  isDeviceMoving = true;
}
```

**For Web (Orientation):**
```javascript
// Calculate change in orientation angles
const betaDelta = |beta_new - beta_old|;
const gammaDelta = |gamma_new - gamma_old|;
const orientationChange = √(betaDelta² + gammaDelta²);

// Calculate change rate (degrees per second)
const changeRate = orientationChange / time_delta;

if (changeRate > 4.0) {
  isDeviceMoving = true;
}
```

### Dead Zone Thresholds

```javascript
const DEAD_ZONE_THRESHOLD = 0.8;      // Minimum angle change to update (degrees)
const MIN_MOVEMENT_ANGLE = 2.0;       // Significant movement threshold
const MIN_UPDATE_INTERVAL = 50;       // Minimum time between updates (ms)
const STABILITY_TIME = 2000;           // Time to mark as stable (ms)
const HIGH_CONFIDENCE_THRESHOLD = 0.7; // Confidence threshold for stability
```

### Update Logic

```javascript
function shouldUpdateHeading(newHeading, confidence, timestamp) {
  // 1. Check minimum update interval
  if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
    return false;  // Too soon
  }
  
  // 2. Calculate angular difference (handling wraparound)
  let diff = |newHeading - lastHeading|;
  if (diff > 180) diff = 360 - diff;
  
  // 3. If device is moving significantly
  if (isDeviceMoving && diff >= MIN_MOVEMENT_ANGLE) {
    return true;  // Allow update
  }
  
  // 4. If device is stationary
  if (diff < DEAD_ZONE_THRESHOLD) {
    // If stable for 2 seconds, freeze updates (only update for large changes)
    if (isStable) {
      return diff >= DEAD_ZONE_THRESHOLD * 2.5;  // Only very large changes
    }
    return false;  // Ignore tiny movements
  }
  
  // 5. Medium changes - be cautious
  return diff >= DEAD_ZONE_THRESHOLD * 1.2;
}
```

**Result:** When stationary, the compass "freezes" like a professional compass, only updating for significant movements.

---

## 4. Web-Specific Calculations

### Device Orientation API

**Priority 1: webkitCompassHeading (iOS Safari)**
```javascript
if (event.webkitCompassHeading !== undefined) {
  angle = event.webkitCompassHeading;  // Already calibrated, use directly
  confidence = 1 - (event.webkitCompassAccuracy / 180);
}
```

**Priority 2: Absolute Orientation**
```javascript
if (event.absolute === true && event.alpha !== null) {
  // alpha: 0° when device points North, increases counterclockwise
  angle = 360 - event.alpha;  // Convert to clockwise from North
  confidence = 0.8;
}
```

**Priority 3: Relative Orientation**
```javascript
if (event.alpha !== null) {
  angle = 360 - event.alpha;
  confidence = 0.6;  // Less reliable
}
```

### Pixel-Specific Corrections

```javascript
if (device.isPixel) {
  if (event.webkitCompassHeading !== undefined) {
    angle = event.webkitCompassHeading;  // Use directly if available
  } else if (event.absolute === true) {
    // May need 180° offset for some Pixel models
    angle = (angle + 180) % 360;
  }
  
  // Extra smoothing for Pixel
  smoothed = pixelFilter.filter(angle);  // α = 0.08 (very smooth)
  
  // Additional stability check - only update if change > 1°
  if (|smoothed - lastHeading| < 1) {
    smoothed = lastHeading;  // Keep previous value
  }
}
```

---

## 5. Animation & Rotation

### Compass Rotation

```javascript
// Convert heading to rotation (compass rotates opposite to heading)
rotation.value = withSpring(-heading, {
  damping: 40-45,    // Higher = less oscillation
  stiffness: 80-90,  // Higher = faster response
  mass: 1.0          // Higher = more inertia
});
```

**Why negative?** The compass visual rotates in the opposite direction to the heading (so North always points up).

### Spring Physics

The `withSpring` animation uses:
- **Damping**: Controls oscillation (higher = less bounce)
- **Stiffness**: Controls speed (higher = faster)
- **Mass**: Controls inertia (higher = smoother, less jitter)

---

## 6. Coordinate System

### Device Coordinate System (Android/iOS Standard)

```
        Y (North)
        ↑
        |
        |
        |
        +----→ X (East)
       /
      /
     Z (Up, out of screen)
```

- **X-axis**: Points to the right edge of device (East)
- **Y-axis**: Points to the top edge of device (North when device points North)
- **Z-axis**: Points out of screen (upward)

### Compass Convention

- **0°** = North
- **90°** = East
- **180°** = South
- **270°** = West
- Increases **clockwise** from North

---

## 7. Complete Calculation Flow

```
1. Read Sensors
   ├─ Magnetometer: (mx, my, mz)
   └─ Accelerometer: (ax, ay, az)

2. Check Device Tilt
   ├─ If tilted: Apply tilt compensation
   └─ If flat: Use simple 2D calculation

3. Calculate Raw Heading
   ├─ Tilted: Project to horizontal plane, then atan2
   └─ Flat: Direct atan2(mx, my)

4. Normalize to 0-360°
   └─ heading = (360 - rawHeading) % 360

5. Apply Low-Pass Filter
   └─ smoothed = filter.filter(heading)

6. Check Stability & Dead Zone
   ├─ Calculate angular difference
   ├─ Check if device is moving
   └─ Apply dead zone threshold

7. Update if Needed
   ├─ If shouldUpdate: Update heading and rotation
   └─ If not: Keep previous value (frozen)

8. Animate Compass
   └─ rotation.value = withSpring(-heading)
```

---

## 8. Key Constants

```javascript
// Filtering
const DEFAULT_ALPHA = 0.12;        // Standard smoothing
const PIXEL_ALPHA = 0.08;           // Pixel-specific (smoother)

// Stability
const DEAD_ZONE_THRESHOLD = 0.8;    // Minimum change to update (degrees)
const MIN_MOVEMENT_ANGLE = 2.0;     // Significant movement (degrees)
const MIN_UPDATE_INTERVAL = 50;     // Minimum time between updates (ms)
const STABILITY_TIME = 2000;        // Time to mark stable (ms)

// Movement Detection
const MOVEMENT_THRESHOLD = 0.5;     // Acceleration change threshold
const STATIONARY_ACCEL_THRESHOLD = 0.3;  // Gravity deviation threshold

// Animation
const SPRING_DAMPING = 40-45;       // Damping for spring animation
const SPRING_STIFFNESS = 80-90;     // Stiffness for spring animation
```

---

## 9. Example Calculation

**Scenario:** Device pointing East (90°), tilted 30° forward

```
1. Magnetometer: mx = 0.5, my = 0.0, mz = 0.2
2. Accelerometer: ax = 0.0, ay = 0.866, az = 0.5 (30° tilt)

3. Calculate tilt:
   pitch = asin(-0.0) = 0°
   roll = asin(0.866 / cos(0°)) = 60°

4. Project to horizontal:
   hx = 0.5 * cos(0°) + 0.2 * sin(0°) = 0.5
   hy = 0.5 * sin(60°) * sin(0°) + 0.0 * cos(60°) - 0.2 * sin(60°) * cos(0°)
     = 0.0 - 0.173 = -0.173

5. Calculate heading:
   rawHeading = atan2(0.5, -0.173) = 109.5°
   heading = (360 - 109.5) % 360 = 250.5°

6. Apply filter (α = 0.12):
   if previous = 90°:
     diff = 250.5 - 90 = 160.5
     if diff > 180: diff = 160.5 - 360 = -199.5
     filtered = 90 + 0.12 * (-199.5) = 90 - 23.94 = 66.06°

7. Check stability:
   diff = |66.06 - 90| = 23.94° > DEAD_ZONE_THRESHOLD (0.8°)
   → Update allowed

8. Rotate compass:
   rotation = -66.06° (compass rotates counterclockwise)
```

---

## Summary

The compass uses:
1. **Magnetometer** for direction
2. **Accelerometer** for tilt compensation
3. **Low-pass filtering** for smoothness
4. **Dead zone** for stability when stationary
5. **Spring animation** for smooth rotation

This creates a professional-grade compass that's stable when stationary and responsive when moving.

