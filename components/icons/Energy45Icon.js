import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

export default function Energy45Icon({ size = 24, color = '#B8860B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" />
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1" fill="none" opacity="0.3" />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      {/* Energy field lines */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 - 90) * (Math.PI / 180);
        const x1 = 12 + 9 * Math.cos(angle);
        const y1 = 12 + 9 * Math.sin(angle);
        const x2 = 12 + 3 * Math.cos(angle);
        const y2 = 12 + 3 * Math.sin(angle);
        return (
          <Line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="1.5"
            opacity="0.6"
          />
        );
      })}
    </Svg>
  );
}

