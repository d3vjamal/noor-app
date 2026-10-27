import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {magnetometer, setUpdateIntervalForType, SensorTypes} from 'react-native-sensors';
import Icon, {IconName} from '../components/Icon';
import BackLink from '../components/BackLink';
import Screen from '../components/Screen';
import HijriTool from './tools/HijriTool';
import NamesTool from './tools/NamesTool';
import TasbihTool from './tools/TasbihTool';
import {useSettings} from '../state/settings';
import {Coords} from '../salat/times';
import {headingFromMag, kaabaDistanceKm, qiblaBearing} from '../tools/qibla';
import {NisabBasis, ZakatInput, calcZakat} from '../tools/zakat';

type Tool = 'zakat' | 'qibla' | 'tasbih' | 'hijri' | 'names';

export default function ToolsScreen() {
  const {t, theme} = useSettings();
  const [tool, setTool] = useState<Tool | null>(null);

  // Android back returns to the tool list instead of leaving the tab.
  useEffect(() => {
    if (!tool) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setTool(null);
      return true;
    });
    return () => sub.remove();
  }, [tool]);

  const items: {key: Tool; icon: IconName; title: string}[] = [
    {key: 'tasbih', icon: 'tasbih', title: t.tools.tasbih},
    {key: 'hijri', icon: 'hijri', title: t.tools.hijri},
    {key: 'names', icon: 'names', title: t.tools.names},
    {key: 'zakat', icon: 'zakat', title: t.tools.zakat},
    {key: 'qibla', icon: 'qibla', title: t.tools.qibla},
  ];

  if (tool === 'tasbih') {
    return <TasbihTool onBack={() => setTool(null)} />;
  }
  if (tool === 'hijri') {
    return <HijriTool onBack={() => setTool(null)} />;
  }
  if (tool === 'names') {
    return <NamesTool onBack={() => setTool(null)} />;
  }
  if (tool === 'zakat') {
    return <ZakatTool onBack={() => setTool(null)} />;
  }
  if (tool === 'qibla') {
    return <QiblaTool onBack={() => setTool(null)} />;
  }
  return (
    <Screen title={t.tools.title}>
      <View style={styles.grid}>
        {items.map(x => (
          <Pressable
            key={x.key}
            accessibilityRole="button"
            accessibilityLabel={x.title}
            onPress={() => setTool(x.key)}
            style={[styles.tile, {backgroundColor: theme.surface, borderColor: theme.border}]}>
            <View style={[styles.iconWrap, {backgroundColor: theme.background}]}>
              <Icon name={x.icon} color={theme.primary} size={28} />
            </View>
            <Text style={[styles.tileTitle, {color: theme.text}]} numberOfLines={2}>
              {x.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const FIELDS = ['cash', 'gold', 'silver', 'goods', 'receivables', 'debts', 'goldPrice', 'silverPrice'] as const;
const FIELD_KEY: Record<(typeof FIELDS)[number], keyof ZakatInput> = {
  cash: 'cash',
  gold: 'goldGrams',
  silver: 'silverGrams',
  goods: 'goodsValue',
  receivables: 'receivables',
  debts: 'debts',
  goldPrice: 'goldPrice',
  silverPrice: 'silverPrice',
};
const ZAKAT_KEY = 'tools.zakat.v1';

function ZakatTool({onBack}: {onBack: () => void}) {
  const {t, theme} = useSettings();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [basis, setBasis] = useState<NisabBasis>('silver');

  // Remember the metal prices between visits.
  useEffect(() => {
    AsyncStorage.getItem(ZAKAT_KEY)
      .then(raw => raw && setVals(JSON.parse(raw)))
      .catch(() => {});
  }, []);
  const set = (k: string, v: string) => {
    const next = {...vals, [k]: v.replace(/[^0-9.]/g, '')};
    setVals(next);
    AsyncStorage.setItem(
      ZAKAT_KEY,
      JSON.stringify({goldPrice: next.goldPrice, silverPrice: next.silverPrice}),
    ).catch(() => {});
  };

  const input = {} as ZakatInput;
  FIELDS.forEach(f => {
    input[FIELD_KEY[f]] = parseFloat(vals[f] || '') || 0;
  });
  const r = calcZakat(input, basis);
  const fmt = (n: number) => n.toLocaleString(undefined, {maximumFractionDigits: 2});

  return (
    <Screen title={t.tools.zakat}>
      <BackLink onBack={onBack} />
      <Text style={{color: theme.textMuted, marginBottom: 12}}>{t.tools.zakatNote}</Text>
      {FIELDS.map(f => (
        <View key={f} style={{marginBottom: 10}}>
          <Text style={{color: theme.text, marginBottom: 4}}>{t.tools[f]}</Text>
          <TextInput
            keyboardType="decimal-pad"
            value={vals[f] ?? ''}
            onChangeText={v => set(f, v)}
            placeholder="0"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, {color: theme.text, borderColor: theme.border, backgroundColor: theme.surface}]}
          />
        </View>
      ))}
      <Text style={{color: theme.text, marginVertical: 4}}>{t.tools.basis}</Text>
      <View style={styles.chips}>
        {(['silver', 'gold'] as const).map(b => {
          const on = b === basis;
          return (
            <Pressable
              key={b}
              onPress={() => setBasis(b)}
              style={[styles.chip, {borderColor: on ? theme.primary : theme.border, backgroundColor: on ? theme.primary : 'transparent'}]}>
              <Text style={{color: on ? theme.onPrimary : theme.text}}>
                {b === 'silver' ? t.tools.basisSilver : t.tools.basisGold}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={{color: theme.text}}>{t.tools.total}: {fmt(r.gross)}</Text>
        <Text style={{color: theme.text}}>{t.tools.net}: {fmt(r.net)}</Text>
        <Text style={{color: theme.text}}>{t.tools.nisab}: {fmt(r.nisab)}</Text>
        {r.eligible ? (
          <Text style={[styles.cardTitle, {color: theme.primary, marginTop: 8}]}>
            {t.tools.zakatDue}: {fmt(r.due)}
          </Text>
        ) : (
          <Text style={{color: theme.textMuted, marginTop: 8}}>{t.tools.notDue}</Text>
        )}
      </View>
    </Screen>
  );
}

function QiblaTool({onBack}: {onBack: () => void}) {
  const {t, theme} = useSettings();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [noSensor, setNoSensor] = useState(false);
  const [busy, setBusy] = useState(false);

  // Reuses the place chosen in the Salat tab (picked place wins over the device fix).
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [manual, device] = await Promise.all([
        AsyncStorage.getItem('salat.manual.v1'),
        AsyncStorage.getItem('salat.location.v1'),
      ]);
      const raw = manual ?? device;
      setCoords(raw ? JSON.parse(raw) : null);
    } catch {}
    setBusy(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.magnetometer, 200);
    let smooth: number | null = null;
    const sub = magnetometer.subscribe({
      next: ({x, y}) => {
        const h = headingFromMag(x, y);
        // Low-pass over the shortest arc so the arrow doesn't jitter or spin at 0/360.
        smooth = smooth === null ? h : (smooth + (((h - smooth + 540) % 360) - 180) * 0.25 + 360) % 360;
        setHeading(smooth);
      },
      error: () => setNoSensor(true),
    });
    return () => sub.unsubscribe();
  }, []);

  const bearing = coords ? qiblaBearing(coords) : null;
  const rotation = bearing !== null && heading !== null ? bearing - heading : bearing ?? 0;

  return (
    <Screen title={t.tools.qibla} onRefresh={load} refreshing={busy}>
      <BackLink onBack={onBack} />
      {bearing === null ? (
        <Text style={{color: theme.textMuted}}>{t.tools.needLocation}</Text>
      ) : (
        <View style={{alignItems: 'center'}}>
          <View style={[styles.dial, {borderColor: theme.border, backgroundColor: theme.surface}]}>
            <Text style={[styles.north, {color: theme.textMuted}]}>N</Text>
            <View style={{transform: [{rotate: `${rotation}deg`}], alignItems: 'center'}}>
              <Text style={{fontSize: 56, color: theme.primary}}>▲</Text>
              <View style={{width: 4, height: 70, backgroundColor: theme.primary}} />
              <Text style={{fontSize: 22}}>🕋</Text>
            </View>
          </View>
          <Text style={[styles.cardTitle, {color: theme.text, marginTop: 16}]}>
            {t.tools.bearing}: {bearing.toFixed(1)}° {t.tools.fromNorth}
          </Text>
          <Text style={{color: theme.textMuted, marginTop: 4}}>
            {t.tools.distance}: {Math.round(kaabaDistanceKm(coords!)).toLocaleString()} {t.tools.km}
          </Text>
          <Text style={{color: theme.textMuted, marginTop: 12, textAlign: 'center'}}>
            {noSensor ? t.tools.noCompass : t.tools.hold}
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  // Three tiles per row; 30% leaves room for the two gaps on narrow phones.
  tile: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconWrap: {width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center'},
  tileTitle: {fontSize: 13, fontWeight: '600', textAlign: 'center'},
  card: {borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12},
  row: {flexDirection: 'row', alignItems: 'center', gap: 14},
  icon: {fontSize: 30},
  cardTitle: {fontSize: 17, fontWeight: '700', marginBottom: 4},
  arabic: {fontSize: 26, lineHeight: 46, textAlign: 'right', marginVertical: 10},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14},
  chip: {borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6},
  input: {borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16},
  dial: {width: 260, height: 260, borderRadius: 130, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  north: {position: 'absolute', top: 8, fontWeight: '700'},
});
