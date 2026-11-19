import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

// Flat masjid skyline: a central dome with a crescent, two minarets and two small domes.
// Single colour so it can sit faintly behind content on any theme.
export default function MasjidArt({color, width = 220}: {color: string; width?: number}) {
  const height = (width * 100) / 220;
  return (
    <Svg width={width} height={height} viewBox="0 0 220 100">
      {/* minarets */}
      <Rect x="14" y="34" width="12" height="66" fill={color} />
      <Path d="M12 34h16l-8-16z" fill={color} />
      <Circle cx="20" cy="14" r="2.5" fill={color} />
      <Rect x="194" y="34" width="12" height="66" fill={color} />
      <Path d="M192 34h16l-8-16z" fill={color} />
      <Circle cx="200" cy="14" r="2.5" fill={color} />
      {/* side domes */}
      <Path d="M44 100V76a20 20 0 0 1 40 0v24z" fill={color} />
      <Path d="M136 100V76a20 20 0 0 1 40 0v24z" fill={color} />
      {/* main dome */}
      <Path d="M80 100V62a30 30 0 0 1 60 0v38z" fill={color} />
      <Path d="M110 32v-8" stroke={color} strokeWidth="2" />
      <Path d="M114 20a6 6 0 1 1-6-9 4.6 4.6 0 0 0 6 9z" fill={color} />
      <Rect x="0" y="96" width="220" height="4" fill={color} />
    </Svg>
  );
}
