import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Path } from 'react-native-svg';

export default function Vastu45Compass({ size }) {
  const center = size / 2;
  const radius = size / 2 - 20;
  const innerRadius = radius - 60;

  // Create 45 energy fields (8 main directions + subdivisions)
  const createEnergyField = (index, totalFields) => {
    const angleStep = 360 / totalFields;
    const startAngle = (index * angleStep - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * angleStep - 90) * (Math.PI / 180);
    
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const x3 = center + innerRadius * Math.cos(endAngle);
    const y3 = center + innerRadius * Math.sin(endAngle);
    const x4 = center + innerRadius * Math.cos(startAngle);
    const y4 = center + innerRadius * Math.sin(startAngle);
    
    return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Outer ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="#FFF8E1"
          stroke="#FFA500"
          strokeWidth="3"
        />

        {/* 45 energy fields */}
        {Array.from({ length: 45 }).map((_, i) => {
          const opacity = 0.05 + (i % 5) * 0.015;
          return (
            <Path
              key={i}
              d={createEnergyField(i, 45)}
              fill={`rgba(255, 165, 0, ${opacity})`}
              stroke="rgba(255, 140, 0, 0.2)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Division lines */}
        {Array.from({ length: 45 }).map((_, i) => {
          const angle = (i * 8 - 90) * (Math.PI / 180);
          const isMajor = i % 5 === 0;
          return (
            <Line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke={isMajor ? "#FF8C00" : "#FFE4B5"}
              strokeWidth={isMajor ? 2.5 : 1}
              opacity={isMajor ? 0.8 : 0.4}
            />
          );
        })}

        {/* Middle rings */}
        <Circle
          cx={center}
          cy={center}
          r={innerRadius + 30}
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          opacity={0.5}
        />
        <Circle
          cx={center}
          cy={center}
          r={innerRadius + 15}
          fill="none"
          stroke="#F4C430"
          strokeWidth="1.5"
          opacity={0.4}
        />

        {/* Inner circle */}
        <Circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="#FFFFFF"
          stroke="#FFA500"
          strokeWidth="2.5"
        />

        {/* Center dot */}
        <Circle
          cx={center}
          cy={center}
          r={11}
          fill="#FF8C00"
        />
        <Circle
          cx={center}
          cy={center}
          r={7}
          fill="#FFD700"
        />

        {/* Main directions */}
        {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((dir, index) => {
          const angle = (index * 45 - 90) * (Math.PI / 180);
          const x = center + (radius - 20) * Math.cos(angle);
          const y = center + (radius - 20) * Math.sin(angle);
          
          return (
            <SvgText
              key={dir}
              x={x}
              y={y + 6}
              fontSize={14}
              fontWeight="bold"
              fill="#B8860B"
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

