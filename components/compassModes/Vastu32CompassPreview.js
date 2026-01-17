import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function Vastu32CompassPreview({ size }) {
  // Match NormalCompassPreview and ChakraCompass scale calculation
  const center = size / 2;
  const radius = size / 2 - 5; // Match NormalCompassPreview
  const innerRadius = radius * 0.65;

  // Only cardinal and intercardinal directions for cleaner preview
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  
  // 32 Vastu pada names (simplified for preview - showing every other one for clarity)
  const padas = [
    'Shi',   // 0
    'Par',   // 1
    'Jay',   // 2
    'Ind',   // 3
    'Sur',   // 4
    'Sat',   // 5
    'Bha',   // 6
    'Aka',   // 7
    'Agn',   // 8
    'Pus',   // 9
    'Vit',   // 10
    'Gri',   // 11
    'Yam',   // 12
    'Gan',   // 13
    'Bhr',   // 14
    'Mri',   // 15
    'Pit',   // 16
    'Dau',   // 17
    'Sug',   // 18
    'Pud',   // 19
    'Var',   // 20
    'Asu',   // 21
    'Sho',   // 22
    'Rog',   // 23
    'Nag',   // 24
    'Muk',   // 25
    'Bhl',   // 26
    'Som',   // 27
    'Bhu',   // 28
    'Adi',   // 29
    'Dit',   // 30
    'Ahi'    // 31
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="needleGradVastu32" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* Outer circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="#FFF8E1"
          stroke="#FF9933"
          strokeWidth="2"
        />

        {/* Inner circle */}
        <Circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="#FFFFFF"
          stroke="#F4C430"
          strokeWidth="2"
        />

        {/* Compass needle */}
        <G>
          {/* North pointer (golden) */}
          <Path
            d={`M ${center} ${center} L ${center - 2.1} ${center + 2.1} L ${center} ${center - (innerRadius - 16)} L ${center + 2.1} ${center + 2.1} Z`}
            fill="url(#needleGradVastu32)"
            stroke="#CC8800"
            strokeWidth="0.8"
          />
          
          {/* South pointer (white) */}
          <Path
            d={`M ${center} ${center} L ${center - 2.5} ${center - 2.5} L ${center} ${center + (innerRadius - 12)} L ${center + 2.5} ${center - 2.5} Z`}
            fill="#FFFFFF"
            stroke="#D4AF37"
            strokeWidth="0.8"
            opacity="0.9"
          />
        </G>

        {/* Center dot */}
        <Circle
          cx={center}
          cy={center}
          r={6}
          fill="#FF9933"
        />
        <Circle
          cx={center}
          cy={center}
          r={3}
          fill="#FFD700"
        />

        {/* 32 Vastu pada labels - positioned inside inner circle, showing every other one for clarity */}
        {padas.map((pada, index) => {
          // 32 zones at 11.25° intervals, starting from North (-90°)
          const angle = (index * 11.25 - 90) * (Math.PI / 180);
          // Position pada labels inside the inner circle, closer to center
          const padaRadius = innerRadius * 0.8;
          const x = center + padaRadius * Math.cos(angle);
          const y = center + padaRadius * Math.sin(angle);
          
          // Only show every other pada for cleaner preview
          if (index % 2 === 0) {
            return (
              <SvgText
                key={`pada-${index}`}
                x={x}
                y={y + 3}
                fontSize={size * 0.025}
                fontWeight="550"
                fontFamily="'DM Sans', sans-serif"
                fill="#C9A961"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {pada}
              </SvgText>
            );
          }
          return null;
        })}

        {/* Only show 8 main direction labels (N, NE, E, SE, S, SW, W, NW) */}
        {directions.map((dir, index) => {
          const angle = (index * 45 - 90) * (Math.PI / 180);
          const isCardinal = ['N', 'E', 'S', 'W'].includes(dir);
          // Position text further out from center, closer to circumference
          const labelPadding = isCardinal ? (dir === 'N' ? 6 : 8) : 7;
          const labelRadius = radius - labelPadding;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          
          return (
            <SvgText
              key={dir}
              x={x}
              y={y + (isCardinal ? (dir === 'N' ? 3 : 5) : 4)}
              fontSize={isCardinal ? size * 0.07 : size * 0.05}
              fontWeight={isCardinal ? "bold" : "600"}
              fontFamily="'DM Sans', sans-serif"
              fill="#78350f"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {dir}
            </SvgText>
          );
        })}
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

