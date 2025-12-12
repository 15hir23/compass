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

export default function NormalCompass({ size }) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
        <Defs>
          {/* Gradients */}
          <RadialGradient id="compassBg" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFEF7" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFF8DC" stopOpacity="1" />
          </RadialGradient>
          
          <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FDB931" stopOpacity="1" />
            <Stop offset="100%" stopColor="#D4AF37" stopOpacity="1" />
          </LinearGradient>
          
          <LinearGradient id="needleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <Stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
          </LinearGradient>
          
          <RadialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#6B7280" stopOpacity="1" />
            <Stop offset="50%" stopColor="#4B5563" stopOpacity="1" />
            <Stop offset="100%" stopColor="#374151" stopOpacity="1" />
          </RadialGradient>
        </Defs>

        {/* Outer decorative ring */}
        <Circle cx="200" cy="200" r="190" fill="none" stroke="url(#goldGrad)" strokeWidth="6" opacity="0.3"/>
        <Circle cx="200" cy="200" r="185" fill="none" stroke="#FFD700" strokeWidth="2"/>
        
        {/* Element color ring segments */}
        {/* Water (North) */}
        <Path d="M 200 35 A 165 165 0 0 1 365 200 L 345 200 A 145 145 0 0 0 200 55 Z" 
              fill="url(#goldGrad)" opacity="0.15"/>
        
        {/* Fire (East) */}
        <Path d="M 365 200 A 165 165 0 0 1 200 365 L 200 345 A 145 145 0 0 0 345 200 Z" 
              fill="url(#goldGrad)" opacity="0.2"/>
        
        {/* Earth (South) */}
        <Path d="M 200 365 A 165 165 0 0 1 35 200 L 55 200 A 145 145 0 0 0 200 345 Z" 
              fill="url(#goldGrad)" opacity="0.25"/>
        
        {/* Air (West) */}
        <Path d="M 35 200 A 165 165 0 0 1 200 35 L 200 55 A 145 145 0 0 0 55 200 Z" 
              fill="url(#goldGrad)" opacity="0.18"/>
        
        {/* Inner circle background */}
        <Circle cx="200" cy="200" r="145" fill="url(#compassBg)"/>
        
        {/* Subtle inner rings */}
        <Circle cx="200" cy="200" r="140" fill="none" stroke="#DAA520" strokeWidth="0.5" opacity="0.3"/>
        <Circle cx="200" cy="200" r="130" fill="none" stroke="#DAA520" strokeWidth="0.5" opacity="0.2"/>
        
        {/* Crosshair lines */}
        <Line x1="200" y1="70" x2="200" y2="330" stroke="#DAA520" strokeWidth="1" opacity="0.2"/>
        <Line x1="70" y1="200" x2="330" y2="200" stroke="#DAA520" strokeWidth="1" opacity="0.2"/>
        
        {/* Degree markings */}
        <G stroke="#B8860B" strokeWidth="1.5" opacity="0.6">
          {/* Main cardinal marks */}
          <Line x1="200" y1="55" x2="200" y2="70" strokeWidth="2"/>
          <Line x1="330" y1="200" x2="345" y2="200" strokeWidth="2"/>
          <Line x1="200" y1="330" x2="200" y2="345" strokeWidth="2"/>
          <Line x1="55" y1="200" x2="70" y2="200" strokeWidth="2"/>
        </G>
        
        <G stroke="#DAA520" strokeWidth="1" opacity="0.4">
          {/* 45 degree marks */}
          <Line x1="246" y1="76" x2="238" y2="84"/>
          <Line x1="324" y1="154" x2="316" y2="162"/>
          <Line x1="324" y1="246" x2="316" y2="238"/>
          <Line x1="246" y1="324" x2="238" y2="316"/>
          <Line x1="154" y1="324" x2="162" y2="316"/>
          <Line x1="76" y1="246" x2="84" y2="238"/>
          <Line x1="76" y1="154" x2="84" y2="162"/>
          <Line x1="154" y1="76" x2="162" y2="84"/>
        </G>
        
        {/* Element labels on outer ring */}
        <SvgText x="200" y="25" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" 
                fill="#B8860B" textAnchor="middle" letterSpacing="2">WATER</SvgText>
        
        <SvgText x="375" y="207" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" 
                fill="#B8860B" textAnchor="middle" letterSpacing="2">FIRE</SvgText>
        
        <SvgText x="200" y="385" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" 
                fill="#B8860B" textAnchor="middle" letterSpacing="2">EARTH</SvgText>
        
        <SvgText x="25" y="207" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" 
                fill="#B8860B" textAnchor="middle" letterSpacing="2">AIR</SvgText>
        
        {/* Direction labels inside */}
        {/* N */}
        <SvgText x="200" y="100" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="700" 
                fill="#B8860B" textAnchor="middle">N</SvgText>
        
        {/* E */}
        <SvgText x="300" y="207" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="600" 
                fill="#8B7355" textAnchor="middle">E</SvgText>
        
        {/* S */}
        <SvgText x="200" y="310" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="600" 
                fill="#8B7355" textAnchor="middle">S</SvgText>
        
        {/* W */}
        <SvgText x="100" y="207" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="600" 
                fill="#8B7355" textAnchor="middle">W</SvgText>
        
        {/* Intercardinal labels */}
        <SvgText x="256" y="144" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="500" 
                fill="#9CA3AF" textAnchor="middle">NE</SvgText>
        
        <SvgText x="256" y="266" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="500" 
                fill="#9CA3AF" textAnchor="middle">SE</SvgText>
        
        <SvgText x="144" y="266" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="500" 
                fill="#9CA3AF" textAnchor="middle">SW</SvgText>
        
        <SvgText x="144" y="144" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="500" 
                fill="#9CA3AF" textAnchor="middle">NW</SvgText>
        
        {/* Compass needle */}
        <G>
          {/* North pointer (golden) */}
          <Path d="M 200 200 L 192 208 L 200 95 L 208 208 Z" 
                fill="url(#needleGrad)" stroke="#CC8800" strokeWidth="1"/>
          
          {/* South pointer (white) */}
          <Path d="M 200 200 L 192 192 L 200 305 L 208 192 Z" 
                fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1" opacity="0.9"/>
          
          {/* East pointer (cream) */}
          <Path d="M 200 200 L 192 192 L 305 200 L 192 208 Z" 
                fill="#FFF8E7" stroke="#D4AF37" strokeWidth="1" opacity="0.7"/>
          
          {/* West pointer (cream) */}
          <Path d="M 200 200 L 208 192 L 95 200 L 208 208 Z" 
                fill="#FFF8E7" stroke="#D4AF37" strokeWidth="1" opacity="0.7"/>
        </G>
        
        {/* Center pivot */}
        <Circle cx="200" cy="200" r="18" fill="url(#goldGrad)"/>
        <Circle cx="200" cy="200" r="16" fill="#FFFEF9"/>
        <Circle cx="200" cy="200" r="12" fill="url(#goldGrad)"/>
        <Circle cx="200" cy="200" r="10" fill="#FFA500"/>
        <Circle cx="200" cy="200" r="6" fill="#FFD600"/>
        <Circle cx="198" cy="198" r="2" fill="#FFFEF9" opacity="0.8"/>
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
