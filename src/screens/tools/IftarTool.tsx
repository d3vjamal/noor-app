import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackLink from '../../components/BackLink';
import Screen from '../../components/Screen';
import {formatTime, timesFor} from '../../salat/times';
import {SalatContext, loadSalatContext} from '../../salat/window';
import {useSettings} from '../../state/settings';
import {fromHijri, toHijri} from '../../tools/hijri';

// Sehri ends at Fajr and iftar is at Maghrib, from the place chosen in the Salat tab.
export default function IftarTool({onBack}: {onBack: () => void}) {
  const {t, theme, settings} = useSettings();
  const locale = settings.language === 'bn' ? 'bn-BD' : 'en-US';
  const [ctx, setCtx] = useState<SalatContext | null>(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    loadSalatContext().then(setCtx);
    AsyncStorage.getItem('tools.hijri.offset.v1')
      .then(raw => setOffset(parseInt(raw || '0', 10) || 0))
      .catch(() => {});
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const day = (n: number) => new Date(now.getTime() + n * 86400000);
  const rows = useMemo(() => {
    if (!ctx?.coords) {
      return null;
    }
    return [0, 1].map(n => {
      const tm = timesFor(ctx.coords!, ctx.prefs, day(n));
      return {label: n === 0 ? t.tools.today : t.tools.tomorrow, sehri: tm.fajr, iftar: tm.maghrib};
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, now.getDate()]);

  const fmt = (d: Date) => formatTime(d, locale, ctx?.timeZone);
  const h = toHijri(now, offset);
  // Days to the next 1 Ramadan, or the day of Ramadan we are in.
  let ramadan = '';
  if (h.month === 9) {
    ramadan = t.tools.ramadanDay.replace('%d', String(h.day));
  } else {
    const year = h.month > 9 ? h.year + 1 : h.year;
    const start = fromHijri({year, month: 9, day: 1});
    const days = Math.max(0, Math.ceil((start.getTime() - now.getTime()) / 86400000));
    ramadan = t.tools.ramadanIn.replace('%d', String(days));
  }

  const nextSehri = rows && rows[0].sehri > now ? rows[0].sehri : rows?.[1].sehri;
  const nextIftar = rows && rows[0].iftar > now ? rows[0].iftar : rows?.[1].iftar;
  const left = (to?: Date) => {
    if (!to) {
      return '';
    }
    const m = Math.max(0, Math.round((to.getTime() - now.getTime()) / 60000));
    return `${Math.floor(m / 60)}${t.home.h} ${m % 60}${t.home.m}`;
  };

  return (
    <Screen title={t.tools.iftar}>
      <BackLink onBack={onBack} />
      <View style={[styles.hero, {backgroundColor: theme.primary}]}>
        <Text style={{color: theme.onPrimary, fontSize: 18, fontWeight: '700'}}>{ramadan}</Text>
      </View>
      {!rows ? (
        <Text style={{color: theme.textMuted}}>{t.tools.needLocation}</Text>
      ) : (
        <>
          <View style={styles.pair}>
            <View style={[styles.box, {backgroundColor: theme.surface, borderColor: theme.border}]}>
              <Text style={{color: theme.textMuted}}>{t.tools.sehriEnds}</Text>
              <Text style={[styles.time, {color: theme.text}]}>{fmt(nextSehri!)}</Text>
              <Text style={{color: theme.primary}}>{left(nextSehri)}</Text>
            </View>
            <View style={[styles.box, {backgroundColor: theme.surface, borderColor: theme.border}]}>
              <Text style={{color: theme.textMuted}}>{t.tools.iftarAt}</Text>
              <Text style={[styles.time, {color: theme.text}]}>{fmt(nextIftar!)}</Text>
              <Text style={{color: theme.primary}}>{left(nextIftar)}</Text>
            </View>
          </View>
          {rows.map(r => (
            <View key={r.label} style={[styles.line, {backgroundColor: theme.surface, borderColor: theme.border}]}>
              <Text style={{color: theme.text, fontWeight: '700', width: 90}}>{r.label}</Text>
              <Text style={{color: theme.textMuted, flex: 1}}>
                {t.tools.sehriEnds} {fmt(r.sehri)}
              </Text>
              <Text style={{color: theme.textMuted}}>
                {t.tools.iftarAt} {fmt(r.iftar)}
              </Text>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {borderRadius: 16, padding: 18, marginBottom: 14, alignItems: 'center'},
  pair: {flexDirection: 'row', gap: 10, marginBottom: 12},
  box: {flex: 1, borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4},
  time: {fontSize: 26, fontWeight: '800'},
  line: {flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginBottom: 8},
});
