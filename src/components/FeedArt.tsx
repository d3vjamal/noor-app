import React from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Path, Pattern, Rect, Stop} from 'react-native-svg';
import Icon, {IconName} from './Icon';
import MasjidArt from './MasjidArt';

export type FeedKind = 'ayah' | 'hadith' | 'dua' | 'name' | 'date';

const PALETTE: Record<FeedKind, [string, string]> = {
  ayah: ['#0F6B4F', '#06352A'],
  hadith: ['#2B4A8C', '#111D44'],
  dua: ['#80386C', '#36132F'],
  name: ['#A3721A', '#45290A'],
  date: ['#0E7C86', '#07343A'],
};
const SUBJECT: Record<FeedKind, IconName> = {
  ayah: 'quran',
  hadith: 'crescent',
  dua: 'heart',
  name: 'names',
  date: 'hijri',
};

// 8-point star used to tile the background, the classic Islamic geometric motif.
const STAR = 'M12 1l2.6 6.4L21 4.8l-2.6 6.6L25 14l-6.6 2.6L21 23.2l-6.4-2.6L12 27l-2.6-6.4L3 23.2l2.6-6.6L-1 14l6.6-2.6L3 4.8l6.4 2.6z';

// A drawn banner for a feed card: gradient, tiled star pattern, a masjid skyline and one large
// symbol for the card's subject. Fixed colours so every card looks rich in any theme.
export default function FeedArt({kind, height = 120}: {kind: FeedKind; height?: number}) {
  const [a, b] = PALETTE[kind];
  return (
    <View style={{height, overflow: 'hidden'}}>
      <Svg width="100%" height={height} viewBox="0 0 360 120" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`g-${kind}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="1" stopColor={b} />
          </LinearGradient>
          <Pattern id={`p-${kind}`} width="30" height="30" patternUnits="userSpaceOnUse">
            <Path d={STAR} transform="translate(3 1) scale(0.8)" fill="none" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="360" height="120" fill={`url(#g-${kind})`} />
        <Rect width="360" height="120" fill={`url(#p-${kind})`} />
      </Svg>
      <View style={styles.skyline} pointerEvents="none">
        <MasjidArt color="#FFFFFF" width={230} />
      </View>
      <View style={styles.subject} pointerEvents="none">
        <Icon name={SUBJECT[kind]} color="#FFFFFF" size={54} strokeWidth={1.3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skyline: {position: 'absolute', left: -12, bottom: 0, opacity: 0.14},
  subject: {position: 'absolute', right: 20, top: 16, opacity: 0.9},
});
