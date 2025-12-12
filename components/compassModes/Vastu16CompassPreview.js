import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';

export default function Vastu16CompassPreview({ size }) {
  const center = size / 2;
  const radius = size / 2 - 10;
  const innerRadius = radius * 0.65;

  // Only cardinal and intercardinal directions for cleaner preview
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Outer circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="#FFF8E1"
          stroke="#FF9933"
          strokeWidth="2"
        />

        {/* 16 division lines */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 22.5 - 90) * (Math.PI / 180);
          const isMajor = i % 2 === 0; // Every other line is major
          return (
            <Line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke={isMajor ? "#FF8C00" : "#FFE4B5"}
              strokeWidth={isMajor ? 1.5 : 0.8}
              opacity={isMajor ? 0.7 : 0.4}
            />
          );
        })}

        {/* Inner circle */}
        <Circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="#FFFFFF"
          stroke="#F4C430"
          strokeWidth="2"
        />

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

        {/* Only show 8 main direction labels (N, NE, E, SE, S, SW, W, NW) */}
        {directions.map((dir, index) => {
          const angle = (index * 45 - 90) * (Math.PI / 180);
          const labelRadius = radius - 12;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          const isCardinal = ['N', 'E', 'S', 'W'].includes(dir);
          
          return (
            <SvgText
              key={dir}
              x={x}
              y={y + 4}
              fontSize={isCardinal ? size * 0.08 : size * 0.06}
              fontWeight={isCardinal ? "bold" : "600"}
              fill={isCardinal ? "#B8860B" : "#8B7355"}
              textAnchor="middle"
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

