import React, {useEffect, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, Text, Vibration, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackLink from '../../components/BackLink';
import Screen from '../../components/Screen';
import {useSettings} from '../../state/settings';

const KEY = 'tools.tasbih.v1';
const DHIKR = [
  {key: 'dhikr1', ar: 'سُبْحَانَ اللَّهِ', target: 33},
  {key: 'dhikr2', ar: 'الْحَمْدُ لِلَّهِ', target: 33},
  {key: 'dhikr3', ar: 'اللَّهُ أَكْبَرُ', target: 34},
  {key: 'dhikr4', ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ', target: 100},
  {key: 'dhikr5', ar: 'أَسْتَغْفِرُ اللَّهَ', target: 100},
  {key: 'dhikr6', ar: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', target: 100},
] as const;
const TARGETS = [0, 33, 99, 100];


// Ring geometry: 33 beads plus the larger imam bead share 34 slots around the thread.
const BEADS = 33;
const SLOTS = BEADS + 1;
const SIZE = 300;
const R = 118;
const BEAD = 22;
const WOOD = '#8B5A2B';
const WOOD_EDGE = '#4E3016';

function Bead({x, y, d, lit, color}: {x: number; y: number; d: number; lit: boolean; color: string}) {
  return (
    <View
      style={[
        styles.bead,
        {
          left: x - d / 2,
          top: y - d / 2,
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: lit ? color : WOOD,
          borderColor: lit ? color : WOOD_EDGE,
        },
        lit && styles.beadLit,
      ]}>
      <View style={[styles.shine, {width: d * 0.28, height: d * 0.28, borderRadius: d}]} />
    </View>
  );
}

function BeadString({count, color, thread}: {count: number; color: string; thread: string}) {
  const c = SIZE / 2;
  const done = count > 0 && count % BEADS === 0 ? BEADS : count % BEADS;
  const beads = [];
  for (let i = 0; i < BEADS; i++) {
    // Slot 0 is the imam bead at the bottom; counting runs clockwise from it.
    const a = Math.PI / 2 + ((i + 1) * 2 * Math.PI) / SLOTS;
    beads.push(<Bead key={i} x={c + R * Math.cos(a)} y={c + R * Math.sin(a)} d={BEAD} lit={i < done} color={color} />);
  }
  const bottom = c + R;
  return (
    <View style={styles.stringBox}>
      <View style={[styles.thread, {borderColor: thread, left: c - R, top: c - R, width: 2 * R, height: 2 * R, borderRadius: R}]} />
      {beads}
      <Bead x={c} y={bottom} d={32} lit={false} color={color} />
      <View style={[styles.stem, {backgroundColor: thread, left: c - 1, top: bottom + 16, height: 12}]} />
      {[0, 1, 2].map(i => (
        <Bead key={i} x={c} y={bottom + 36 + i * 17} d={16} lit={false} color={color} />
      ))}
      <View style={[styles.stem, {backgroundColor: thread, left: c - 1, top: bottom + 80, height: 8}]} />
      <View style={[styles.knot, {left: c - 7, top: bottom + 86}]} />
      {[-8, -4, 0, 4, 8].map(dx => (
        <View key={dx} style={[styles.fringe, {left: c + dx - 1, top: bottom + 98, height: 30 - Math.abs(dx)}]} />
      ))}
    </View>
  );
}

type Saved = {dhikr: number; target: number; count: number};

export default function TasbihTool({onBack}: {onBack: () => void}) {
  const {t, theme} = useSettings();
  const [s, setS] = useState<Saved>({dhikr: 0, target: 33, count: 0});

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => raw && setS(JSON.parse(raw)))
      .catch(() => {});
  }, []);
  const save = (next: Saved) => {
    setS(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };

  const bounce = useRef(new Animated.Value(1)).current;
  const tap = () => {
    Animated.sequence([
      Animated.timing(bounce, {toValue: 0.92, duration: 60, useNativeDriver: true}),
      Animated.spring(bounce, {toValue: 1, useNativeDriver: true}),
    ]).start();
    const count = s.count + 1;
    save({...s, count});
    Vibration.vibrate(s.target && count % s.target === 0 ? 300 : 15);
  };
  const pick = (i: number) => save({dhikr: i, target: DHIKR[i].target, count: 0});
  const reached = s.target > 0 && s.count >= s.target;

  return (
    <Screen title={t.tools.tasbih}>
      <BackLink onBack={onBack} />
      <View style={styles.chips}>
        {DHIKR.map((d, i) => {
          const on = s.dhikr === i;
          return (
            <Pressable
              key={d.key}
              onPress={() => pick(i)}
              style={[
                styles.chip,
                {borderColor: on ? theme.primary : theme.border, backgroundColor: on ? theme.primary : 'transparent'},
              ]}>
              <Text style={{color: on ? theme.onPrimary : theme.text}}>
                {t.tools[d.key as keyof typeof t.tools] as string}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.arabic, {color: theme.text}]}>{DHIKR[s.dhikr].ar}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.tools.count}
        onPress={tap}
        style={styles.stage}>
        <BeadString count={s.count} color={theme.primary} thread={theme.textMuted} />
        <Animated.View
          style={[
            styles.counter,
            {borderColor: theme.primary, backgroundColor: theme.surface, transform: [{scale: bounce}]},
          ]}>
          <Text style={[styles.num, {color: theme.primary}]}>{s.count}</Text>
          <Text style={{color: theme.textMuted}}>{s.target ? `/ ${s.target}` : t.tools.free}</Text>
        </Animated.View>
      </Pressable>
      <Text style={[styles.hint, {color: reached ? theme.primary : theme.textMuted}]}>
        {reached ? t.tools.done : t.tools.tapHint}
      </Text>

      <Text style={{color: theme.text, marginTop: 20, marginBottom: 6}}>{t.tools.target}</Text>
      <View style={styles.chips}>
        {TARGETS.map(n => {
          const on = s.target === n;
          return (
            <Pressable
              key={n}
              onPress={() => save({...s, target: n})}
              style={[
                styles.chip,
                {borderColor: on ? theme.primary : theme.border, backgroundColor: on ? theme.primary : 'transparent'},
              ]}>
              <Text style={{color: on ? theme.onPrimary : theme.text}}>{n || t.tools.free}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => save({...s, count: 0})}
        style={[styles.reset, {borderColor: theme.border}]}>
        <Text style={{color: theme.text}}>{t.tools.reset}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10},
  chip: {borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6},
  arabic: {fontSize: 30, lineHeight: 52, textAlign: 'center', marginVertical: 8},
  stage: {width: SIZE, height: SIZE + 140, alignSelf: 'center'},
  stringBox: {position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE + 140},
  thread: {position: 'absolute', borderWidth: 2},
  bead: {position: 'absolute', borderWidth: 1.5, elevation: 2, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 2, shadowOffset: {width: 0, height: 1}},
  beadLit: {elevation: 4},
  shine: {position: 'absolute', top: '16%', left: '20%', backgroundColor: 'rgba(255,255,255,0.4)'},
  stem: {position: 'absolute', width: 2},
  knot: {position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: WOOD, borderWidth: 1.5, borderColor: WOOD_EDGE},
  fringe: {position: 'absolute', width: 2, borderRadius: 1, backgroundColor: WOOD},
  counter: {
    position: 'absolute',
    left: SIZE / 2 - 80,
    top: SIZE / 2 - 80,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {fontSize: 54, fontWeight: '700'},
  hint: {textAlign: 'center', marginTop: 12},
  reset: {alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, marginTop: 8},
});
