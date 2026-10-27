import React from 'react';
import Svg, {Circle, G, Path, Rect} from 'react-native-svg';

export type IconName =
  | 'home' | 'library' | 'salat' | 'dua' | 'tools' | 'settings'
  | 'tasbih' | 'hijri' | 'names' | 'zakat' | 'qibla'
  | 'sun' | 'food' | 'house' | 'mosque' | 'compass' | 'heart' | 'grid'
  | 'drop' | 'shield' | 'moon' | 'cloud' | 'play' | 'stop' | 'copy' | 'whatsapp' | 'share' | 'check';

const MOSQUE = 'M2.5 21h19 M5.5 21v-5.5a6.5 6.5 0 0 1 13 0V21 M12 9V6 M10 21v-3a2 2 0 0 1 4 0v3 M2.5 21V11 M21.5 21V11';
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

// Outline icons on a 24x24 grid, drawn with the passed colour; `fill` marks shapes that are solid.
function body(name: IconName, c: string): React.ReactNode {
  switch (name) {
    case 'home':
    case 'mosque':
      return (
        <>
          <Path d={MOSQUE} />
          <Path d="M1.5 11h2l-1-2.5z M20.5 11h2l-1-2.5z" fill={c} />
          <Path d="M12 6c-1 0-1.6-.8-1.2-1.8.2-.5.7-.9 1.2-1.2" />
        </>
      );
    case 'library':
      return (
        <>
          <Path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
          <Path d="M12 6.5v13" />
          <Path d="M12 2.5l.8 1.5 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.3z" fill={c} strokeWidth={0.6} />
        </>
      );
    case 'salat':
      return (
        <>
          <Path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.7 6.7 0 0 0 10.5 10.5z" />
          <Path d="M17 4l.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1L14 6.2l2.1-.3z" fill={c} strokeWidth={0.6} />
        </>
      );
    case 'dua':
      return (
        <>
          <Path d="M12 20.5C7 19.5 3.5 15.5 3.5 9c3 0 6 2.2 8.5 6" />
          <Path d="M12 20.5c5-1 8.5-5 8.5-11.5-3 0-6 2.2-8.5 6" />
          <Path d="M12 15v5.5 M12 3.5l.7 1.4 1.5.2-1.1 1.1.3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1.1 1.5-.2z" />
        </>
      );
    case 'tools':
      return (
        <>
          <Rect x={6.5} y={6.5} width={11} height={11} rx={1} />
          <Rect x={6.5} y={6.5} width={11} height={11} rx={1} transform="rotate(45 12 12)" />
          <Circle cx={12} cy={12} r={2} />
        </>
      );
    case 'settings':
      return (
        <>
          <Path d="M4 7h2.8 M11.2 7H20 M4 12h8.8 M17.2 12H20 M4 17h1.8 M10.2 17H20" />
          <Circle cx={9} cy={7} r={2.2} />
          <Circle cx={15} cy={12} r={2.2} />
          <Circle cx={8} cy={17} r={2.2} />
        </>
      );
    case 'tasbih':
      return (
        <>
          {RAYS.concat(22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5).slice(0, 12).map((a, i) => {
            const r = (((i * 30) - 90) * Math.PI) / 180;
            return <Circle key={i} cx={12 + 6.5 * Math.cos(r)} cy={9.5 + 6.5 * Math.sin(r)} r={1.4} fill={c} />;
          })}
          <Path d="M12 17.2v1.6" />
          <Circle cx={12} cy={19.6} r={1.2} />
          <Path d="M10.8 21l.2 1.5 M13.2 21l-.2 1.5 M12 21v1.5" />
        </>
      );
    case 'hijri':
      return (
        <>
          <Rect x={4} y={5} width={16} height={15} rx={2} />
          <Path d="M4 10h16 M8 3v4 M16 3v4" />
          <Path d="M14.5 17.5a3 3 0 1 1-2.5-4.9 2.4 2.4 0 0 0 2.5 4.9z" />
        </>
      );
    case 'names':
      return (
        <>
          <Path d="M12 2.5l2.2 7.3 7.3 2.2-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2z" />
          <Circle cx={12} cy={12} r={1.5} fill={c} />
        </>
      );
    case 'zakat':
      return (
        <>
          <Path d="M5 8c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3z" />
          <Path d="M5 8v4c0 1.7 3.1 3 7 3s7-1.3 7-3V8 M5 12v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" />
        </>
      );
    case 'qibla':
      return (
        <>
          <Path d="M4 7l8-3 8 3v13H4z" />
          <Path d="M4 7l8 3 8-3 M4 11h16 M14.5 20v-5h3v5" />
        </>
      );
    case 'sun':
      return (
        <>
          <Circle cx={12} cy={12} r={4} />
          {RAYS.map(a => (
            <Path key={a} d="M12 2.5v3" transform={`rotate(${a} 12 12)`} />
          ))}
        </>
      );
    case 'food':
      return (
        <>
          <Path d="M3.5 11h17a8.5 8 0 0 1-17 0z" />
          <Path d="M9 3.5c-1 1.5 1 2.5 0 4.5 M13 3.5c-1 1.5 1 2.5 0 4.5 M17 4.5c-1 1.2.8 2 0 3.5" />
        </>
      );
    case 'house':
      return <Path d="M3.5 11L12 3.5l8.5 7.5v9.5h-17z M10 20.5V15h4v5.5" />;
    case 'compass':
      return (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z" />
        </>
      );
    case 'heart':
      return <Path d="M12 20.5s-7.5-4.8-7.5-10.5A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.6c0 5.7-7.5 10.5-7.5 10.5z" />;
    case 'grid':
      return (
        <>
          <Rect x={4} y={4} width={6.5} height={6.5} rx={1.5} />
          <Rect x={13.5} y={4} width={6.5} height={6.5} rx={1.5} />
          <Rect x={4} y={13.5} width={6.5} height={6.5} rx={1.5} />
          <Rect x={13.5} y={13.5} width={6.5} height={6.5} rx={1.5} />
        </>
      );
    case 'drop':
      return <Path d="M12 3.5c3.5 4.2 6 7.2 6 10.2a6 6 0 0 1-12 0c0-3 2.5-6 6-10.2z" />;
    case 'shield':
      return <Path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" />;
    case 'moon':
      return <Path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.7 6.7 0 0 0 10.5 10.5z" />;
    case 'cloud':
      return <Path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6-1A4.5 4.5 0 0 1 17 18z" />;
    case 'play':
      return <Path d="M8 5v14l11-7z" fill={c} />;
    case 'stop':
      return <Rect x={6} y={6} width={12} height={12} rx={2} fill={c} />;
    case 'copy':
      return (
        <>
          <Rect x={8.5} y={8.5} width={11} height={11} rx={2} />
          <Path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
        </>
      );
    case 'whatsapp':
      return (
        <>
          <Path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />
          <Path d="M9 8.5c-.4 1 0 2.4 1.2 3.8s2.8 2.4 4 2.3c.6-.1 1.2-.6 1.2-1.1l-1.8-.9-.9.8c-1-.4-2-1.3-2.5-2.3l.7-.9-.8-1.9c-.5 0-1.2.1-1.1.2z" fill={c} strokeWidth={0.5} />
        </>
      );
    case 'share':
      return (
        <>
          <Circle cx={6} cy={12} r={2.5} />
          <Circle cx={17.5} cy={5.5} r={2.5} />
          <Circle cx={17.5} cy={18.5} r={2.5} />
          <Path d="M8.2 10.8l7.1-4.1 M8.2 13.2l7.1 4.1" />
        </>
      );
    case 'check':
      return <Path d="M5 12.5l4.5 4.5L19 7.5" />;
  }
}

type Props = {name: IconName; color: string; size?: number; strokeWidth?: number};

export default function Icon({name, color, size = 24, strokeWidth = 1.7}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {body(name, color)}
      </G>
    </Svg>
  );
}
