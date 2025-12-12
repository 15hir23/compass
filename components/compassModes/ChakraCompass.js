import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { 
  Circle, 
  Line, 
  Text as SvgText, 
  G, 
  Path, 
  Defs, 
  LinearGradient, 
  Stop,
  RadialGradient
} from 'react-native-svg';

export default function ChakraCompass({ size }) {
  const center = 250; // vastu-chakra.svg uses 500x500 viewBox
  const scale = size / 500;
  
  // 32 outer deities with their positions from SVG
  const outerDeities = [
    { name: "Indra", x: 271.07, y: 36.04, angle: -84.38 },
    { name: "Surya", x: 312.41, y: 44.26, angle: -73.13 },
    { name: "Satya", x: 351.35, y: 60.39, angle: -61.88 },
    { name: "Bhasha", x: 386.39, y: 83.80, angle: -50.63 },
    { name: "Akash", x: 416.20, y: 113.61, angle: -39.38 },
    { name: "Atul", x: 439.61, y: 148.65, angle: -28.13 },
    { name: "Pusha", x: 455.74, y: 187.59, angle: -16.88 },
    { name: "Vitatha", x: 463.96, y: 228.93, angle: -5.63 },
    { name: "Grihrakshit", x: 463.96, y: 271.07, angle: 185.63 },
    { name: "Yama", x: 455.74, y: 312.41, angle: 196.88 },
    { name: "Gandharv", x: 439.61, y: 351.35, angle: 208.13 },
    { name: "Bhringraj", x: 416.20, y: 386.39, angle: 219.38 },
    { name: "Mrita", x: 386.39, y: 416.20, angle: 230.63 },
    { name: "Pitr", x: 351.35, y: 439.61, angle: 241.88 },
    { name: "Dauvrik", x: 312.41, y: 455.74, angle: 253.13 },
    { name: "Sugriva", x: 271.07, y: 463.96, angle: 264.38 },
    { name: "Varun", x: 228.93, y: 463.96, angle: 275.63 },
    { name: "Asur", x: 187.59, y: 455.74, angle: 286.88 },
    { name: "Shosha", x: 148.65, y: 439.61, angle: 298.13 },
    { name: "Papyakshma", x: 120.00, y: 410.00, angle: 309.38 },
    { name: "Roga", x: 83.80, y: 386.39, angle: 320.63 },
    { name: "Naga", x: 60.39, y: 351.35, angle: 331.88 },
    { name: "Mukhya", x: 44.26, y: 312.41, angle: 343.13 },
    { name: "Bhallat", x: 36.04, y: 271.07, angle: 354.38 },
    { name: "Soma", x: 36.04, y: 228.93, angle: 185.63 },
    { name: "Bhujaga", x: 44.26, y: 187.59, angle: 196.88 },
    { name: "Aditi", x: 60.39, y: 148.65, angle: 208.13 },
    { name: "Diti", x: 83.80, y: 113.61, angle: 219.38 },
    { name: "Shikhi", x: 113.61, y: 83.80, angle: 230.63 },
    { name: "Parjanya", x: 148.65, y: 60.39, angle: 241.88 },
    { name: "Jayant", x: 187.59, y: 44.26, angle: 253.13 },
    { name: "Indra", x: 228.93, y: 36.04, angle: 264.38 }
  ];

  // Outer ring lines (from mid to outer)
  const outerLines = [
    { x1: 250.00, y1: 90.00, x2: 250.00, y2: 10.00 },
    { x1: 281.21, y1: 93.07, x2: 296.82, y2: 14.61 },
    { x1: 311.23, y1: 102.18, x2: 341.84, y2: 28.27 },
    { x1: 338.89, y1: 116.96, x2: 383.34, y2: 50.45 },
    { x1: 363.14, y1: 136.86, x2: 419.71, y2: 80.29 },
    { x1: 383.04, y1: 161.11, x2: 449.55, y2: 116.66 },
    { x1: 397.82, y1: 188.77, x2: 471.73, y2: 158.16 },
    { x1: 406.93, y1: 218.79, x2: 485.39, y2: 203.18 },
    { x1: 410.00, y1: 250.00, x2: 490.00, y2: 250.00 },
    { x1: 406.93, y1: 281.21, x2: 485.39, y2: 296.82 },
    { x1: 397.82, y1: 311.23, x2: 471.73, y2: 341.84 },
    { x1: 383.04, y1: 338.89, x2: 449.55, y2: 383.34 },
    { x1: 363.14, y1: 363.14, x2: 419.71, y2: 419.71 },
    { x1: 338.89, y1: 383.04, x2: 383.34, y2: 449.55 },
    { x1: 311.23, y1: 397.82, x2: 341.84, y2: 471.73 },
    { x1: 281.21, y1: 406.93, x2: 296.82, y2: 485.39 },
    { x1: 250.00, y1: 410.00, x2: 250.00, y2: 490.00 },
    { x1: 218.79, y1: 406.93, x2: 203.18, y2: 485.39 },
    { x1: 188.77, y1: 397.82, x2: 158.16, y2: 471.73 },
    { x1: 161.11, y1: 383.04, x2: 116.66, y2: 449.55 },
    { x1: 136.86, y1: 363.14, x2: 80.29, y2: 419.71 },
    { x1: 116.96, y1: 338.89, x2: 50.45, y2: 383.34 },
    { x1: 102.18, y1: 311.23, x2: 28.27, y2: 341.84 },
    { x1: 93.07, y1: 281.21, x2: 14.61, y2: 296.82 },
    { x1: 90.00, y1: 250.00, x2: 10.00, y2: 250.00 },
    { x1: 93.07, y1: 218.79, x2: 14.61, y2: 203.18 },
    { x1: 102.18, y1: 188.77, x2: 28.27, y2: 158.16 },
    { x1: 116.96, y1: 161.11, x2: 50.45, y2: 116.66 },
    { x1: 136.86, y1: 136.86, x2: 80.29, y2: 80.29 },
    { x1: 161.11, y1: 116.96, x2: 116.66, y2: 50.45 },
    { x1: 188.77, y1: 102.18, x2: 158.16, y2: 28.27 },
    { x1: 218.79, y1: 93.07, x2: 203.18, y2: 14.61 }
  ];
  
  // Inner ring lines (from inner to mid)
  const innerLines = [
    { x1: 250.00, y1: 150.00, x2: 250.00, y2: 90.00 },
    { x1: 320.71, y1: 179.29, x2: 363.14, y2: 136.86 },
    { x1: 350.00, y1: 250.00, x2: 410.00, y2: 250.00 },
    { x1: 320.71, y1: 320.71, x2: 363.14, y2: 363.14 },
    { x1: 250.00, y1: 350.00, x2: 250.00, y2: 410.00 },
    { x1: 179.29, y1: 320.71, x2: 136.86, y2: 363.14 },
    { x1: 150.00, y1: 250.00, x2: 90.00, y2: 250.00 },
    { x1: 179.29, y1: 179.29, x2: 136.86, y2: 136.86 }
  ];
  
  // Inner labels
  const innerLabels = [
    { text: "Aapha Vasta", x: 299.75, y: 129.90 },
    { text: "Airyama", x: 372.16, y: 205.54 },
    { text: "Savitra", x: 367.82, y: 304.94 },
    { text: "Bram", x: 299.75, y: 370.10 },
    { text: "Vivasvam", x: 200.25, y: 370.10 },
    { text: "Indra", x: 132.18, y: 304.94 },
    { text: "Jaya", x: 127.84, y: 205.54 },
    { text: "Rudra Jaya", x: 200.25, y: 129.90 }
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
        <Defs>
          <RadialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFEF9" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFF5E1" stopOpacity="1" />
          </RadialGradient>
          
          <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#D4AF37" stopOpacity="1" />
            <Stop offset="50%" stopColor="#DAA520" stopOpacity="1" />
            <Stop offset="100%" stopColor="#B8860B" stopOpacity="1" />
          </LinearGradient>
          
          <LinearGradient id="needleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* Background */}
        <Circle cx="250" cy="250" r="245" fill="url(#bgGradient)"/>
        
        {/* Outer circle */}
        <Circle cx="250" cy="250" r="240" stroke="url(#goldGrad)" strokeWidth="2" fill="none"/>
        
        {/* Mid circle */}
        <Circle cx="250" cy="250" r="160" stroke="#C9A961" strokeWidth="2" fill="none"/>
        
        {/* Inner circle */}
        <Circle cx="250" cy="250" r="100" stroke="#D4AF37" strokeWidth="2" fill="none"/>
        
        {/* Outer ring lines */}
        {outerLines.map((line, i) => (
            <Line
            key={`outer-line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#C9A961"
            strokeWidth="1.5"
            />
        ))}

        {/* Outer text labels */}
        {outerDeities.map((deity, i) => (
          <SvgText
            key={`outer-text-${i}`}
            x={deity.x}
            y={deity.y}
            fontSize="11"
            fontWeight="bold"
            fill="#8B6914"
            textAnchor="middle"
            transform={`rotate(${deity.angle}, ${deity.x}, ${deity.y})`}
          >
            {deity.name}
          </SvgText>
        ))}
        
        {/* Inner ring lines */}
        {innerLines.map((line, i) => (
        <Line
            key={`inner-line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#C9A961"
            strokeWidth="1.5"
        />
        ))}
        
        {/* Inner text labels - rendered with white background for visibility */}
        {innerLabels.map((label, i) => (
          <G key={`inner-text-${i}`}>
            {/* White background/stroke text - rendered first */}
            <SvgText
              x={label.x}
              y={label.y}
              fontSize="12"
              fontWeight="800"
              fill="#FFFFFF"
              textAnchor="middle"
              stroke="#FFFFFF"
              strokeWidth="4"
            >
              {label.text}
            </SvgText>
            {/* Actual text - rendered on top */}
            <SvgText
              x={label.x}
              y={label.y}
              fontSize="12"
              fontWeight="800"
              fill="#996515"
              textAnchor="middle"
            >
              {label.text}
            </SvgText>
          </G>
        ))}
        
        {/* Compass lines */}
        <Line x1="250" y1="10" x2="250" y2="490" stroke="url(#goldGrad)" strokeWidth="3"/>
        <Line x1="10" y1="250" x2="490" y2="250" stroke="#C9A961" strokeWidth="1.5"/>
        
        {/* Compass needle */}
        <G>
          <Path
            d="M 250 250 L 242 260 L 250 120 L 258 260 Z"
            fill="url(#needleGrad)"
            stroke="#CC8800"
            strokeWidth="1"
          />
          <Path
            d="M 250 250 L 242 240 L 250 380 L 258 240 Z"
          fill="#FFFFFF"
            stroke="#D4AF37"
            strokeWidth="1"
            opacity="0.9"
        />
        </G>

        {/* Center pivot */}
        <Circle cx="250" cy="250" r="20" fill="url(#goldGrad)"/>
        <Circle cx="250" cy="250" r="18" fill="#FFFEF9"/>
        <Circle cx="250" cy="250" r="14" fill="url(#goldGrad)"/>
        <Circle cx="250" cy="250" r="12" fill="#FFA500"/>
        <Circle cx="250" cy="250" r="8" fill="#FFD600"/>
        <Circle cx="248" cy="248" r="3" fill="#FFFEF9" opacity="0.8"/>
        
        {/* Cardinal direction labels */}
        <SvgText
          x="250"
          y="25"
          fontSize="18"
          fontWeight="bold"
          fill="#B8860B"
          textAnchor="middle"
          stroke="#FFFEF0"
          strokeWidth="3"
        >
          N
        </SvgText>
        <SvgText
          x="250"
          y="480"
          fontSize="18"
          fontWeight="bold"
          fill="#B8860B"
          textAnchor="middle"
          stroke="#FFFEF0"
          strokeWidth="3"
        >
          S
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
