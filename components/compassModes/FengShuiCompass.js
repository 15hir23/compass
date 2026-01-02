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
  Rect
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

export default function FengShuiCompass({ heading = 0 }) {
  const size = getResponsiveSize(280);
  const center = size / 2;
  const radius = size * 0.4;

  // Bagua (8 trigrams) with Chinese names
  const bagua = [
    { angle: 0, name: 'KAN', chinese: '坎', element: 'Water', color: '#4169E1' },
    { angle: 45, name: 'GEN', chinese: '艮', element: 'Mountain', color: '#8B4513' },
    { angle: 90, name: 'ZHEN', chinese: '震', element: 'Thunder', color: '#32CD32' },
    { angle: 135, name: 'XUN', chinese: '巽', element: 'Wind', color: '#7FFF00' },
    { angle: 180, name: 'LI', chinese: '离', element: 'Fire', color: '#DC143C' },
    { angle: 225, name: 'KUN', chinese: '坤', element: 'Earth', color: '#DEB887' },
    { angle: 270, name: 'DUI', chinese: '兑', element: 'Lake', color: '#87CEEB' },
    { angle: 315, name: 'QIAN', chinese: '乾', element: 'Heaven', color: '#FFD700' },
  ];

  // Cardinal directions
  const directions = [
    { angle: 0, label: 'N' },
    { angle: 90, label: 'E' },
    { angle: 180, label: 'S' },
    { angle: 270, label: 'W' },
  ];

  // Render degree markers
  const renderDegreeMarkers = () => {
    const markers = [];
    for (let i = 0; i < 360; i += 5) {
      const angle = (i - 90) * (Math.PI / 180);
      const isMajor = i % 15 === 0;
      const startRadius = radius * 0.92;
      const endRadius = isMajor ? radius * 0.98 : radius * 0.95;
      
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
          stroke={isMajor ? '#8B4513' : '#CD853F'}
          strokeWidth={isMajor ? 2 : 1}
        />
      );
    }
    return markers;
  };

  // Render Bagua sections
  const renderBagua = () => {
    return bagua.map((gua, index) => {
      const startAngle = gua.angle - 22.5 - 90;
      const endAngle = gua.angle + 22.5 - 90;
      const midAngle = gua.angle - 90;
      
      const labelRadius = radius * 0.7;
      const labelAngle = midAngle * (Math.PI / 180);
      const labelX = center + labelRadius * Math.cos(labelAngle);
      const labelY = center + labelRadius * Math.sin(labelAngle);
      
      const chineseRadius = radius * 0.55;
      const chineseX = center + chineseRadius * Math.cos(labelAngle);
      const chineseY = center + chineseRadius * Math.sin(labelAngle);

      return (
        <G key={gua.name}>
          {/* Bagua name in English */}
          <SvgText
            x={labelX}
            y={labelY}
            fontSize={10}
            fontWeight="700"
            fill="#8B4513"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {gua.name}
          </SvgText>
          
          {/* Chinese character */}
          <SvgText
            x={chineseX}
            y={chineseY}
            fontSize={16}
            fontWeight="bold"
            fill={gua.color}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {gua.chinese}
          </SvgText>
        </G>
      );
    });
  };

  // Render direction labels
  const renderDirections = () => {
    return directions.map((dir) => {
      const angle = (dir.angle - 90) * (Math.PI / 180);
      const labelRadius = radius * 1.12;
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle);

      return (
        <SvgText
          key={dir.label}
          x={x}
          y={y}
          fontSize={18}
          fontWeight="bold"
          fill="#DC143C"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {dir.label}
        </SvgText>
      );
    });
  };

  // Render Yin-Yang symbol at center (no rotation - handled by CompassView)
  const renderYinYang = () => {
    const yinYangRadius = radius * 0.25;
    
    return (
      <G>
        {/* Yang (white) half */}
        <Path
          d={`M ${center} ${center - yinYangRadius}
              A ${yinYangRadius} ${yinYangRadius} 0 0 1 ${center} ${center + yinYangRadius}
              A ${yinYangRadius / 2} ${yinYangRadius / 2} 0 0 1 ${center} ${center}
              A ${yinYangRadius / 2} ${yinYangRadius / 2} 0 0 0 ${center} ${center - yinYangRadius}
              Z`}
          fill="#FFFFFF"
          stroke="#2C2C2C"
          strokeWidth={2}
        />
        
        {/* Yin (black) half */}
        <Path
          d={`M ${center} ${center - yinYangRadius}
              A ${yinYangRadius} ${yinYangRadius} 0 0 0 ${center} ${center + yinYangRadius}
              A ${yinYangRadius / 2} ${yinYangRadius / 2} 0 0 0 ${center} ${center}
              A ${yinYangRadius / 2} ${yinYangRadius / 2} 0 0 1 ${center} ${center - yinYangRadius}
              Z`}
          fill="#2C2C2C"
          stroke="#2C2C2C"
          strokeWidth={2}
        />
        
        {/* Yang dot in Yin */}
        <Circle
          cx={center}
          cy={center + yinYangRadius / 2}
          r={yinYangRadius * 0.15}
          fill="#FFFFFF"
        />
        
        {/* Yin dot in Yang */}
        <Circle
          cx={center}
          cy={center - yinYangRadius / 2}
          r={yinYangRadius * 0.15}
          fill="#2C2C2C"
        />
      </G>
    );
  };

  // Render compass needle (subtle red line) - no rotation, handled by CompassView
  const renderNeedle = () => {
    const needleLength = radius * 0.35;
    
    return (
      <G>
        <Line
          x1={center}
          y1={center - needleLength}
          x2={center}
          y2={center + needleLength}
          stroke="#DC143C"
          strokeWidth={3}
          opacity={0.7}
        />
      </G>
    );
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="fengShuiGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFF8DC" stopOpacity="1" />
            <Stop offset="1" stopColor="#F5DEB3" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>

        {/* Outer ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="url(#fengShuiGradient)"
          stroke="#8B4513"
          strokeWidth={4}
        />

        {/* Inner ring for Bagua */}
        <Circle
          cx={center}
          cy={center}
          r={radius * 0.85}
          fill="none"
          stroke="#CD853F"
          strokeWidth={2}
        />

        {/* Bagua dividers */}
        {bagua.map((gua) => {
          const angle1 = (gua.angle - 22.5 - 90) * (Math.PI / 180);
          const x1 = center + (radius * 0.40) * Math.cos(angle1);
          const y1 = center + (radius * 0.40) * Math.sin(angle1);
          const x2 = center + (radius * 0.85) * Math.cos(angle1);
          const y2 = center + (radius * 0.85) * Math.sin(angle1);
          
          return (
            <Line
              key={`divider-${gua.name}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#8B4513"
              strokeWidth={2}
            />
          );
        })}

        {/* Degree markers */}
        {renderDegreeMarkers()}

        {/* Bagua sections */}
        {renderBagua()}

        {/* Direction labels */}
        {renderDirections()}

        {/* Compass needle */}
        {renderNeedle()}

        {/* Yin-Yang at center */}
        {renderYinYang()}
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


