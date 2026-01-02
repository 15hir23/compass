import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export default function ChakraIcon({ size = 24, color = '#B8860B' }) {
  // Create 8-petal chakra
  const center = 12;
  const outerRadius = 9;
  const innerRadius = 5;
  
  const createPetal = (index) => {
    const angleStep = 360 / 8;
    const startAngle = (index * angleStep - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * angleStep - 90) * (Math.PI / 180);
    const midAngle = ((index + 0.5) * angleStep - 90) * (Math.PI / 180);
    
    const outerX1 = center + outerRadius * Math.cos(startAngle);
    const outerY1 = center + outerRadius * Math.sin(startAngle);
    const outerX2 = center + outerRadius * Math.cos(endAngle);
    const outerY2 = center + outerRadius * Math.sin(endAngle);
    
    const midX = center + (outerRadius - 2) * Math.cos(midAngle);
    const midY = center + (outerRadius - 2) * Math.sin(midAngle);
    
    const innerX1 = center + innerRadius * Math.cos(startAngle);
    const innerY1 = center + innerRadius * Math.sin(startAngle);
    const innerX2 = center + innerRadius * Math.cos(endAngle);
    const innerY2 = center + innerRadius * Math.sin(endAngle);
    
    return `M ${outerX1} ${outerY1} Q ${midX} ${midY} ${outerX2} ${outerY2} L ${innerX2} ${innerY2} Q ${center} ${center} ${innerX1} ${innerY1} Z`;
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Path
          key={i}
          d={createPetal(i)}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.7"
        />
      ))}
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

