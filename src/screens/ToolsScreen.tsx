import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler, Linking, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {magnetometer, setUpdateIntervalForType, SensorTypes} from 'react-native-sensors';
import Icon, {IconName} from '../components/Icon';
import BackLink from '../components/BackLink';
import Screen from '../components/Screen';
import HijriTool from './tools/HijriTool';
import NamesTool from './tools/NamesTool';
import TasbihTool from './tools/TasbihTool';
import ZakatTool from './tools/ZakatTool';
import QazaTool from './tools/QazaTool';
import IftarTool from './tools/IftarTool';
import KhatamTool from './tools/KhatamTool';
import FitrahTool from './tools/FitrahTool';
import PrayerLogTool from './tools/PrayerLogTool';
import SunnahFastTool from './tools/SunnahFastTool';
import GuideTool from './tools/GuideTool';
import {ADHKAR, SALAH, WUDU} from '../tools/guides';
import {useSettings} from '../state/settings';
import {Coords} from '../salat/times';
import {headingFromMag, kaabaDistanceKm, qiblaBearing} from '../tools/qibla';

type Tool = 'zakat' | 'qibla' | 'tasbih' | 'hijri' | 'names' | 'qaza' | 'iftar' | 'khatam' | 'fitrah' | 'prayerlog' | 'sunnahfast' | 'wudu' | 'salah' | 'adhkar' | 'mosque';

export default function ToolsScreen() {
  const {t, theme, settings} = useSettings();
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
    {key: 'iftar', icon: 'moon', title: t.tools.iftar},
    {key: 'qaza', icon: 'check', title: t.tools.qaza},
    {key: 'khatam', icon: 'quran', title: t.tools.khatam},
    {key: 'fitrah', icon: 'heart', title: t.tools.fitrah},
    {key: 'prayerlog', icon: 'salat', title: t.tools.prayerLog},
    {key: 'sunnahfast', icon: 'sun', title: t.tools.sunnahFast},
    {key: 'wudu', icon: 'drop', title: t.tools.wudu},
    {key: 'salah', icon: 'mosque', title: t.tools.salahGuide},
    {key: 'adhkar', icon: 'dua', title: t.tools.adhkar},
    {key: 'mosque', icon: 'kaaba', title: t.tools.mosques},
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
  const lang = settings.language;
  if (tool === 'prayerlog') {
    return <PrayerLogTool onBack={() => setTool(null)} />;
  }
  if (tool === 'sunnahfast') {
    return <SunnahFastTool onBack={() => setTool(null)} />;
  }
  if (tool === 'wudu') {
    return <GuideTool title={t.tools.wudu} steps={WUDU[lang]} onBack={() => setTool(null)} />;
  }
  if (tool === 'salah') {
    return <GuideTool title={t.tools.salahGuide} steps={SALAH[lang]} onBack={() => setTool(null)} />;
  }
  if (tool === 'adhkar') {
    return <GuideTool title={t.tools.adhkar} steps={ADHKAR[lang]} onBack={() => setTool(null)} />;
  }
  if (tool === 'qaza') {
    return <QazaTool onBack={() => setTool(null)} />;
  }
  if (tool === 'iftar') {
    return <IftarTool onBack={() => setTool(null)} />;
  }
  if (tool === 'khatam') {
    return <KhatamTool onBack={() => setTool(null)} />;
  }
  if (tool === 'fitrah') {
    return <FitrahTool onBack={() => setTool(null)} />;
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
            onPress={() =>
              x.key === 'mosque'
                ? Linking.openURL('geo:0,0?q=mosque').catch(() =>
                    Linking.openURL('https://www.google.com/maps/search/mosque').catch(() => {}),
                  )
                : setTool(x.key)
            }
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
