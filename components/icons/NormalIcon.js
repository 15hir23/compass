import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

export default function NormalIcon({ size = 24, color = '#B8860B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Line x1="12" y1="3" x2="12" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="7" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

