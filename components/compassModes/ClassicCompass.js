import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { 
  Circle, 
  Line, 
  Text as SvgText, 
  G, 
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Polygon
} from 'react-native-svg';

const getDimensions = () => {
  try {
    return Dimensions.get('window');
  } catch (error) {
    return { width: 375, height: 812 };
  }
};

const getResponsiveSize = (size) => {
  const { width } = getDimensions();
  if (!width || width === 0) return size;
  
  if (Platform.OS === 'web') {
    const effectiveWidth = Math.min(width, 600);
    const scale = effectiveWidth / 375;
    return Math.max(size * scale, size * 0.8);
  }
  
  const scale = width / 375;
  return Math.max(size * scale, size * 0.8);
};

export default function ClassicCompass({ heading = 0 }) {
  const size = getResponsiveSize(280);
  const center = size / 2;
  const radius = size * 0.4;

  // Cardinal directions
  const directions = [
    { angle: 0, label: 'N', color: '#DC143C' },
    { angle: 45, label: 'NE', color: '#2C2C2C' },
    { angle: 90, label: 'E', color: '#2C2C2C' },
    { angle: 135, label: 'SE', color: '#2C2C2C' },
    { angle: 180, label: 'S', color: '#2C2C2C' },
    { angle: 225, label: 'SW', color: '#2C2C2C' },
    { angle: 270, label: 'W', color: '#2C2C2C' },
    { angle: 315, label: 'NW', color: '#2C2C2C' },
  ];

  // Degree markers
  const renderDegreeMarkers = () => {
    const markers = [];
    for (let i = 0; i < 360; i += 10) {
      const angle = (i - 90) * (Math.PI / 180);
      const isMajor = i % 30 === 0;
      const startRadius = radius * 0.85;
      const endRadius = isMajor ? radius * 0.95 : radius * 0.90;
      
      const x1 = center + startRadius * Math.cos(angle);
      const y1 = center + startRadius * Math.sin(angle);
      const x2 = center + endRadius * Math.cos(angle);
      const y2 = center + endRadius * Math.sin(angle);

      markers.push(
        <Line
          key={`marker-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isMajor ? '#2C2C2C' : '#999999'}
          strokeWidth={isMajor ? 2 : 1}
        />
      );
    }
    return markers;
  };

  // Render direction labels
  const renderDirections = () => {
    return directions.map((dir) => {
      const angle = (dir.angle - 90) * (Math.PI / 180);
      const labelRadius = radius * 1.15;
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle);

      return (
        <SvgText
          key={dir.label}
          x={x}
          y={y}
          fontSize={dir.label.length === 1 ? 24 : 16}
          fontWeight={dir.label === 'N' ? 'bold' : '600'}
          fill={dir.color}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {dir.label}
        </SvgText>
      );
    });
  };

  // Render compass needle (no rotation - handled by CompassView)
  const renderNeedle = () => {
    const needleLength = radius * 0.75;
    
    return (
      <G>
        {/* North pointer (red) */}
        <Path
          d={`M ${center},${center - needleLength} 
              L ${center - 8},${center - 5}
              L ${center},${center}
              L ${center + 8},${center - 5}
              Z`}
          fill="#DC143C"
          stroke="#8B0000"
          strokeWidth={1}
        />
        
        {/* South pointer (white/gray) */}
        <Path
          d={`M ${center},${center + needleLength}
              L ${center - 8},${center + 5}
              L ${center},${center}
              L ${center + 8},${center + 5}
              Z`}
          fill="#E5E5E5"
          stroke="#666666"
          strokeWidth={1}
        />
        
        {/* Center pin */}
        <Circle
          cx={center}
          cy={center}
          r={6}
          fill="#2C2C2C"
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      </G>
    );
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="compassGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#F5F5F5" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>

        {/* Outer ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="url(#compassGradient)"
          stroke="#2C2C2C"
          strokeWidth={3}
        />

        {/* Degree markers */}
        {renderDegreeMarkers()}

        {/* Direction labels */}
        {renderDirections()}

        {/* Compass needle */}
        {renderNeedle()}
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


