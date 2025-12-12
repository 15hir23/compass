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

export default function Vastu32Compass({ size }) {
  const center = size / 2;
  const scale = size / 600; // vastu32.svg uses 600x600 viewBox
  
  // 32 Pada data with colors from SVG
  const padas = [
    { name: "Shikhi", color: "#B8860B" },
    { name: "Parjanya", color: "#DAA520" },
    { name: "Jayant", color: "#CC9900" },
    { name: "Indra", color: "#B8860B" },
    { name: "Surya", color: "#FFA500" },
    { name: "Satya", color: "#FF8C00" },
    { name: "Bhallat", color: "#DAA520" },
    { name: "Akash", color: "#F0C419" },
    { name: "Agni", color: "#B8860B" },
    { name: "Pusha", color: "#D4AF37" },
    { name: "Vitatha", color: "#CC9900" },
    { name: "Grihakshata", color: "#DAA520" },
    { name: "Yama", color: "#FFA500" },
    { name: "Gandharva", color: "#F0C419" },
    { name: "Bhringaraj", color: "#FFB800" },
    { name: "Mriga", color: "#B8860B" },
    { name: "Pitra", color: "#B8860B" },
    { name: "Dauvarika", color: "#DAA520" },
    { name: "Sugriva", color: "#CC9900" },
    { name: "Pushpadanta", color: "#FFA500" },
    { name: "Varuna", color: "#B8860B" },
    { name: "Asura", color: "#FF8C00" },
    { name: "Shosha", color: "#D4AF37" },
    { name: "Roga", color: "#DAA520" },
    { name: "Naga", color: "#B8860B" },
    { name: "Mukhya", color: "#F0C419" },
    { name: "Bhallat", color: "#FFB800" },
    { name: "Soma", color: "#F0C419" },
    { name: "Bhujaga", color: "#DAA520" },
    { name: "Aditi", color: "#F0C419" },
    { name: "Diti", color: "#FFB800" },
    { name: "Ahi", color: "#B8860B" }
  ];

  const outerRadius = 285 * scale;
  const innerRadius = 210 * scale;
  const anglePerSegment = 360 / 32;
  const startAngle = -90; // Start from top

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
        <Defs>
          <RadialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFFBF0" stopOpacity="1" />
          </RadialGradient>
          
          <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
          </LinearGradient>
          
          <LinearGradient id="needleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* Background circle */}
        <Circle cx="300" cy="300" r="290" fill="url(#bgGrad)"/>
        
        {/* Outer ring */}
        <Circle cx="300" cy="300" r="285" fill="none" stroke="#D4AF37" strokeWidth="5"/>
        
        {/* 32 segments */}
        {padas.map((pada, i) => {
          const angle1 = startAngle + (i * anglePerSegment);
          const angle2 = startAngle + ((i + 1) * anglePerSegment);
          
          const rad1 = (angle1 * Math.PI) / 180;
          const rad2 = (angle2 * Math.PI) / 180;
          
          const x1Out = 300 + 285 * Math.cos(rad1);
          const y1Out = 300 + 285 * Math.sin(rad1);
          const x2Out = 300 + 285 * Math.cos(rad2);
          const y2Out = 300 + 285 * Math.sin(rad2);
          
          const x1In = 300 + 210 * Math.cos(rad1);
          const y1In = 300 + 210 * Math.sin(rad1);
          const x2In = 300 + 210 * Math.cos(rad2);
          const y2In = 300 + 210 * Math.sin(rad2);
          
          const largeArc = 0;
          const d = `M ${x1Out} ${y1Out} A 285 285 0 ${largeArc} 1 ${x2Out} ${y2Out} L ${x2In} ${y2In} A 210 210 0 ${largeArc} 0 ${x1In} ${y1In} Z`;
          
          const midAngle = angle1 + (anglePerSegment / 2);
          const midRad = (midAngle * Math.PI) / 180;
          const textRadius = (285 + 210) / 2;
          const textX = 300 + textRadius * Math.cos(midRad);
          const textY = 300 + textRadius * Math.sin(midRad);
          
          return (
            <G key={`segment-${i}`}>
              <Path
                d={d}
                fill={i % 2 === 0 ? "#FFFEF5" : "#FFF9E8"}
                stroke="#C9A961"
                strokeWidth="1"
              />
              <Line
                x1={x1Out}
                y1={y1Out}
                x2={x1In}
                y2={y1In}
                stroke="#C9A961"
                strokeWidth="1"
                opacity="0.4"
              />
              <SvgText
                x={textX}
                y={textY}
                fill={pada.color}
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
                transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
              >
                {pada.name}
              </SvgText>
            </G>
          );
        })}
        
        {/* Inner white circle */}
        <Circle cx="300" cy="300" r="210" fill="#FFFFFF"/>
        
        {/* Cardinal direction labels */}
        <SvgText x="300" y="20" fill="#B8860B" fontSize="36" fontWeight="700" textAnchor="middle">N</SvgText>
        <SvgText x="580" y="300" fill="#B8860B" fontSize="36" fontWeight="700" textAnchor="middle">E</SvgText>
        <SvgText x="300" y="580" fill="#B8860B" fontSize="36" fontWeight="700" textAnchor="middle">S</SvgText>
        <SvgText x="20" y="300" fill="#B8860B" fontSize="36" fontWeight="700" textAnchor="middle">W</SvgText>
        
        {/* Compass needle */}
        <G>
          <Path
            d="M 300 300 L 288 315 L 300 130 L 312 315 Z"
            fill="url(#goldGrad)"
            stroke="#B8860B"
            strokeWidth="1.5"
          />
          <Path
            d="M 300 300 L 288 285 L 300 470 L 312 285 Z"
            fill="#FFFFFF"
            stroke="#D4AF37"
            strokeWidth="1.5"
            opacity="0.95"
          />
        </G>
        
        {/* Center pivot */}
        <Circle cx="300" cy="300" r="24" fill="url(#goldGrad)"/>
        <Circle cx="300" cy="300" r="20" fill="#FFFFFF" stroke="#FFD700" strokeWidth="2"/>
        <Circle cx="300" cy="300" r="12" fill="#FFD700"/>
        <Circle cx="298" cy="298" r="4" fill="#FFFFFF" opacity="0.8"/>
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