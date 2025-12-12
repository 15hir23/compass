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

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const CARDINAL_DIRECTIONS = ['N', 'E', 'S', 'W'];

export default function NormalCompassPreview({ size }) {
  const center = size / 2;
  const radius = size / 2 - 8;
  const innerRadius = radius - 20;

  const getDirectionPosition = (index, isCardinal = false) => {
    const angle = (index * 45 - 90) * (Math.PI / 180);
    const r = isCardinal ? radius - 8 : radius - 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      angle: index * 45,
    };
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="compassBgPreview" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFEF7" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFF8DC" stopOpacity="1" />
          </RadialGradient>
          
          <LinearGradient id="goldGradPreview" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FDB931" stopOpacity="1" />
            <Stop offset="100%" stopColor="#D4AF37" stopOpacity="1" />
          </LinearGradient>
          
          <LinearGradient id="needleGradPreview" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Outer ring with gradient */}
        <Circle
          cx={center}
          cy={center}
          r={radius + 2}
          fill="none"
          stroke="url(#goldGradPreview)"
          strokeWidth="3"
          opacity="0.3"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="#FFF8E1"
          stroke="url(#goldGradPreview)"
          strokeWidth="2.5"
        />

        {/* Inner ring */}
        <Circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="url(#compassBgPreview)"
          stroke="#FFD700"
          strokeWidth="2"
        />

        {/* Subtle inner ring */}
        <Circle
          cx={center}
          cy={center}
          r={innerRadius - 5}
          fill="none"
          stroke="#DAA520"
          strokeWidth="0.8"
          opacity="0.4"
        />

        {/* Direction markers and labels */}
        {DIRECTIONS.map((dir, index) => {
          const pos = getDirectionPosition(index);
          const isCardinal = CARDINAL_DIRECTIONS.includes(dir);
          
          return (
            <G key={dir}>
              {/* Marker line */}
              <Line
                x1={center + (isCardinal ? innerRadius : innerRadius + 6) * Math.cos((pos.angle - 90) * Math.PI / 180)}
                y1={center + (isCardinal ? innerRadius : innerRadius + 6) * Math.sin((pos.angle - 90) * Math.PI / 180)}
                x2={center + (isCardinal ? radius - 2 : radius - 10) * Math.cos((pos.angle - 90) * Math.PI / 180)}
                y2={center + (isCardinal ? radius - 2 : radius - 10) * Math.sin((pos.angle - 90) * Math.PI / 180)}
                stroke={isCardinal ? "#B8860B" : "#DAA520"}
                strokeWidth={isCardinal ? 2.5 : 1.2}
              />
              
              {/* Label */}
              <SvgText
                x={pos.x}
                y={pos.y + 4}
                fontSize={isCardinal ? size * 0.13 : size * 0.09}
                fontWeight={isCardinal ? "800" : "700"}
                fill={isCardinal ? "#B8860B" : "#8B7355"}
                textAnchor="middle"
                stroke={isCardinal ? "#FFFFFF" : "none"}
                strokeWidth={isCardinal ? "0.5" : "0"}
              >
                {dir}
              </SvgText>
            </G>
          );
        })}

        {/* Enhanced compass needle with proper styling */}
        <G>
          {/* North pointer (golden) */}
          <Path
            d={`M ${center} ${center} L ${center - 4} ${center + 4} L ${center} ${center - (innerRadius - 8)} L ${center + 4} ${center + 4} Z`}
            fill="url(#needleGradPreview)"
            stroke="#CC8800"
            strokeWidth="0.8"
          />
          
          {/* South pointer (white) */}
          <Path
            d={`M ${center} ${center} L ${center - 4} ${center - 4} L ${center} ${center + (innerRadius - 8)} L ${center + 4} ${center - 4} Z`}
            fill="#FFFFFF"
            stroke="#D4AF37"
            strokeWidth="0.8"
            opacity="0.9"
          />
          
          {/* East pointer (cream) */}
          <Path
            d={`M ${center} ${center} L ${center - 4} ${center - 4} L ${center + (innerRadius - 8)} ${center} L ${center - 4} ${center + 4} Z`}
            fill="#FFF8E7"
            stroke="#D4AF37"
            strokeWidth="0.8"
            opacity="0.7"
          />
          
          {/* West pointer (cream) */}
          <Path
            d={`M ${center} ${center} L ${center + 4} ${center - 4} L ${center - (innerRadius - 8)} ${center} L ${center + 4} ${center + 4} Z`}
            fill="#FFF8E7"
            stroke="#D4AF37"
            strokeWidth="0.8"
            opacity="0.7"
          />
        </G>

        {/* Enhanced center pivot */}
        <Circle
          cx={center}
          cy={center}
          r={6}
          fill="url(#goldGradPreview)"
        />
        <Circle
          cx={center}
          cy={center}
          r={5}
          fill="#FFFEF9"
        />
        <Circle
          cx={center}
          cy={center}
          r={3.5}
          fill="url(#goldGradPreview)"
        />
        <Circle
          cx={center}
          cy={center}
          r={2.5}
          fill="#FFA500"
        />
        <Circle
          cx={center - 0.5}
          cy={center - 0.5}
          r={1}
          fill="#FFFFFF"
          opacity="0.9"
        />
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
