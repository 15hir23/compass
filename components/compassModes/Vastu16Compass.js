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
  RadialGradient,
  Rect
} from 'react-native-svg';

export default function Vastu16Compass({ size }) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
        <Defs>
          {/* Gradients */}
          <RadialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFBF0" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFF8E7" stopOpacity="1" />
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
        </Defs>
        
        {/* Main background circle */}
        <Circle cx="250" cy="250" r="240" fill="url(#bgGrad)"/>

        {/* Outer golden ring */}
        <Circle cx="250" cy="250" r="235" fill="none" stroke="url(#goldGrad)" strokeWidth="3" opacity="0.8"/>
        <Circle cx="250" cy="250" r="230" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.5"/>
        
        {/* Zone ring background (yellow area) */}
        <Circle cx="250" cy="250" r="210" fill="#FFFEF9" opacity="0.5"/>
        
        {/* Division lines for 16 zones */}
        <G stroke="#E5C100" strokeWidth="0.8" opacity="0.25">
          <Line x1="250" y1="40" x2="250" y2="460"/>
          <Line x1="40" y1="250" x2="460" y2="250"/>
          <Line x1="101.5" y1="101.5" x2="398.5" y2="398.5"/>
          <Line x1="398.5" y1="101.5" x2="101.5" y2="398.5"/>
          <Line x1="250" y1="40" x2="353.5" y2="91" transform="rotate(22.5 250 250)"/>
          <Line x1="250" y1="40" x2="353.5" y2="91" transform="rotate(67.5 250 250)"/>
          <Line x1="250" y1="40" x2="353.5" y2="91" transform="rotate(112.5 250 250)"/>
          <Line x1="250" y1="40" x2="353.5" y2="91" transform="rotate(157.5 250 250)"/>
          <Line x1="250" y1="40" x2="353.5" y2="91" transform="rotate(202.5 250 250)"/>
          <Line x1="250" y1="40" x2="353.5" y2="91" transform="rotate(247.5 250 250)"/>
          <Line x1="250" y1="40" x2="353.5" y2="91" transform="rotate(292.5 250 250)"/>
          <Line x1="250" y1="40" x2="353.5" y2="91" transform="rotate(337.5 250 250)"/>
        </G>
        
        {/* Inner clean circle (white area) */}
        <Circle cx="250" cy="250" r="175" fill="#FFFEF9"/>
        <Circle cx="250" cy="250" r="175" fill="none" stroke="#E5C100" strokeWidth="1" opacity="0.3"/>
        
        {/* Cardinal markers */}
        <G fill="url(#goldGrad)">
          <Rect x="245" y="35" width="10" height="15" rx="2"/>
          <Rect x="470" y="245" width="15" height="10" rx="2"/>
          <Rect x="245" y="470" width="10" height="15" rx="2"/>
          <Rect x="15" y="245" width="15" height="10" rx="2"/>
        </G>
        
        {/* Cardinal directions (0°, 90°, 180°, 270°) */}
        <G fontFamily="'Segoe UI', Arial, sans-serif" fontWeight="700" fill="#B8860B">
          <SvgText x="250" y="25" fontSize="24" textAnchor="middle">N</SvgText>
          <SvgText x="450" y="256" fontSize="22" textAnchor="start">E</SvgText>
          <SvgText x="250" y="460" fontSize="22" textAnchor="middle">S</SvgText>
          <SvgText x="60" y="256" fontSize="22" textAnchor="end">W</SvgText>
        </G>
        
        {/* All 16 compass directions on same circle (radius ~195) */}
        <G fontFamily="'Segoe UI', Arial, sans-serif" fontSize="11" fontWeight="600" fill="#A0826D">
          {/* NNE at 22.5° */}
          <SvgText x="324" y="73" textAnchor="middle">NNE</SvgText>
          {/* NE at 45° */}
          <SvgText x="391" y="114" fontSize="13" fontWeight="700" textAnchor="middle">NE</SvgText>
          {/* ENE at 67.5° */}
          <SvgText x="433" y="176" textAnchor="middle">ENE</SvgText>
          {/* ESE at 112.5° */}
          <SvgText x="433" y="332" textAnchor="middle">ESE</SvgText>
          {/* SE at 135° */}
          <SvgText x="391" y="394" fontSize="13" fontWeight="700" textAnchor="middle">SE</SvgText>
          {/* SSE at 157.5° */}
          <SvgText x="324" y="435" textAnchor="middle">SSE</SvgText>
          {/* SSW at 202.5° */}
          <SvgText x="176" y="435" textAnchor="middle">SSW</SvgText>
          {/* SW at 225° */}
          <SvgText x="109" y="394" fontSize="13" fontWeight="700" textAnchor="middle">SW</SvgText>
          {/* WSW at 247.5° */}
          <SvgText x="67" y="332" textAnchor="middle">WSW</SvgText>
          {/* WNW at 292.5° */}
          <SvgText x="67" y="176" textAnchor="middle">WNW</SvgText>
          {/* NW at 315° */}
          <SvgText x="109" y="114" fontSize="13" fontWeight="700" textAnchor="middle">NW</SvgText>
          {/* NNW at 337.5° */}
          <SvgText x="176" y="73" textAnchor="middle">NNW</SvgText>
        </G>
        
        {/* Vastu zone labels (in white area - inner ring) */}
        <G fontFamily="'Segoe UI', Arial, sans-serif" fontSize="12" fontWeight="500" fill="#C9A961">
          {/* North section */}
          <SvgText x="250" y="105" textAnchor="middle">Ish</SvgText>
          <SvgText x="320" y="128" textAnchor="middle">Pit</SvgText>
          <SvgText x="180" y="128" textAnchor="middle">Adi</SvgText>
          
          {/* East section */}
          <SvgText x="360" y="148" textAnchor="middle">Agn</SvgText>
          <SvgText x="382" y="192" textAnchor="middle">Ind</SvgText>
          <SvgText x="398" y="250" textAnchor="middle">Vay</SvgText>
          <SvgText x="382" y="308" textAnchor="middle">Nai</SvgText>
          <SvgText x="360" y="352" textAnchor="middle">Var</SvgText>
          
          {/* South section */}
          <SvgText x="320" y="372" textAnchor="middle">Som</SvgText>
          <SvgText x="250" y="395" textAnchor="middle">Bra</SvgText>
          <SvgText x="180" y="372" textAnchor="middle">Jay</SvgText>
          
          {/* West section */}
          <SvgText x="140" y="352" textAnchor="middle">Sat</SvgText>
          <SvgText x="118" y="308" textAnchor="middle">Vis</SvgText>
          <SvgText x="102" y="250" textAnchor="middle">Rud</SvgText>
          <SvgText x="118" y="192" textAnchor="middle">Pus</SvgText>
          <SvgText x="140" y="148" textAnchor="middle">Gan</SvgText>
        </G>
        
        {/* Compass needle */}
        <G>
          {/* North pointer */}
          <Path d="M 250 250 L 242 260 L 250 120 L 258 260 Z" fill="url(#needleGrad)" stroke="#CC8800" strokeWidth="1"/>
          
          {/* South pointer */}
          <Path d="M 250 250 L 242 240 L 250 380 L 258 240 Z" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1" opacity="0.9"/>
          
          {/* East pointer */}
          <Path d="M 250 250 L 240 242 L 380 250 L 240 258 Z" fill="#FFF8E7" stroke="#D4AF37" strokeWidth="1" opacity="0.7"/>
          
          {/* West pointer */}
          <Path d="M 250 250 L 260 242 L 120 250 L 260 258 Z" fill="#FFF8E7" stroke="#D4AF37" strokeWidth="1" opacity="0.7"/>
        </G>
        
        {/* Center pivot */}
        <Circle cx="250" cy="250" r="20" fill="url(#goldGrad)"/>
        <Circle cx="250" cy="250" r="18" fill="#FFFEF9"/>
        <Circle cx="250" cy="250" r="14" fill="url(#goldGrad)"/>
        <Circle cx="250" cy="250" r="12" fill="#FFA500"/>
        <Circle cx="250" cy="250" r="8" fill="#FFD600"/>
        <Circle cx="248" cy="248" r="3" fill="#FFFEF9" opacity="0.8"/>
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
