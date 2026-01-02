# UI Sections Overview - Color Theme Planning

## Homepage (HomeScreen.js)

### 1. **Header Section**
   - Gradient background (yellow/amber tones)
   - Hamburger menu button (left)
   - App title with compass icon (center)
   - Language toggle (right)

### 2. **Select Compass Label**
   - Text label prompting compass selection

### 3. **Compass Type Cards** (4 cards: Normal, Vastu16, Vastu32, Chakra)
   - Each card contains:
     - Gradient background (yellow/amber)
     - Corner decorations (gold borders)
     - Glassmorphic overlay
     - Left rectangle accent
     - Compass preview (left side)
     - Title & subtitle (center)
     - "explore →" button (right)

### 4. **Footer Section**
   - Logo circle with compass icon
   - Footer text
   - Decorative line

### 5. **Modals**
   - Sidebar (menu drawer)
   - How to Use modal (instructions)

---

## Compass Page (CompassView.js + App.js)

### 1. **Top Navigation Bar** (CompassTopBar)
   - Gradient background (yellow/amber)
   - Back button (circular, left)
   - Search bar (center, expandable)
   - Language toggle + Menu button (right)

### 2. **Action Buttons** (CompassActionButtons)
   - Map button (left, circular with icon)
   - Degree/Direction display (center box with glow)
   - Camera button (right, circular with icon)

### 3. **Main Compass Display** (CompassView)
   - Compass visualization (rotates with heading)
   - Heading indicator (top, yellow arrow/line)
   - Stability indicator (bottom, "Locked" badge when stable)
   - Calibration overlay (figure-8 animation)
   - Image overlay support (with zoom controls)

### 4. **Info Bar** (CompassInfoBar)
   - Geographic coordinates (left)
   - Magnetic field strength (right, red text)
   - Gradient background container

### 5. **Bottom Navigation** (CompassBottomNav)
   - Capture button (pill-shaped, gradient)
   - Last Captured button (pill-shaped, gradient)

### 6. **Modals & Overlays**
   - Location Search overlay
   - Camera Capture modal
   - Image Gallery modal
   - Map View modal
   - Sidebar menu
   - How to Use modal

---

## Color Theme Areas to Update

**Primary Colors:** Yellow/Amber (#F4C430, #FFD700, #B8860B)
**Backgrounds:** White, cream tones (#FFF8E1, #FFFEF5)
**Text:** Dark brown (#3E2723), brown (#6D5443)
**Accents:** Gold borders, shadows, gradients
**Status:** Red for magnetic field, green for stability

