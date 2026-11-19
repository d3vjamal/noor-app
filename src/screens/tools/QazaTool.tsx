import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackLink from '../../components/BackLink';
import Screen from '../../components/Screen';
import {useSettings} from '../../state/settings';

const KEY = 'tools.qaza.v1';
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr'] as const;
type P = (typeof PRAYERS)[number];

// Counts of missed prayers still to be made up. Tap "made up" as each one is prayed.
export default function QazaTool({onBack}: {onBack: () => void}) {
  const {t, theme} = useSettings();
  const [counts, setCounts] = useState<Record<P, number>>({fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0});

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => raw && setCounts(c => ({...c, ...JSON.parse(raw)})))
      .catch(() => {});
  }, []);

  const change = (p: P, d: number) => {
    const next = {...counts, [p]: Math.max(0, counts[p] + d)};
    setCounts(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };
  const total = PRAYERS.reduce((n, p) => n + counts[p], 0);
  const names = {...t.salat, witr: t.tools.witr} as Record<string, string>;

  const Btn = ({label, onPress, primary}: {label: string; onPress: () => void; primary?: boolean}) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.btn, {backgroundColor: primary ? theme.primary : theme.background, borderColor: primary ? theme.primary : theme.border}]}>
      <Text style={{color: primary ? theme.onPrimary : theme.text, fontSize: 20, fontWeight: '700'}}>{label}</Text>
    </Pressable>
  );

  return (
    <Screen title={t.tools.qaza}>
      <BackLink onBack={onBack} />
      <Text style={{color: theme.textMuted, marginBottom: 12}}>{t.tools.qazaNote}</Text>
      <View style={[styles.total, {backgroundColor: theme.primary}]}>
        <Text style={{color: theme.onPrimary, opacity: 0.85}}>{t.tools.qazaLeft}</Text>
        <Text style={{color: theme.onPrimary, fontSize: 40, fontWeight: '800'}}>{total}</Text>
      </View>
      {PRAYERS.map(p => (
        <View key={p} style={[styles.row, {backgroundColor: theme.surface, borderColor: theme.border}]}>
          <View style={{flex: 1}}>
            <Text style={{color: theme.text, fontSize: 17, fontWeight: '600'}}>{names[p]}</Text>
            <Text style={{color: theme.textMuted, fontSize: 13}}>{t.tools.qazaCount.replace('%d', String(counts[p]))}</Text>
          </View>
          <Btn label="+" onPress={() => change(p, 1)} />
          <Btn label="✓" primary onPress={() => change(p, -1)} />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  total: {borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 14},
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 12, marginBottom: 8},
  btn: {width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
});
