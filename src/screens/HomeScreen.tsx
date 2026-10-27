import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import Icon, {IconName} from '../components/Icon';
import Screen from '../components/Screen';
import {ROWS, Row, formatTime} from '../salat/times';
import {SalatContext, loadSalatContext, prayerWindow} from '../salat/window';
import {useSettings} from '../state/settings';
import {toHijri} from '../tools/hijri';

const SHORTCUTS = [
  {tab: 'Library', icon: 'library', key: 'library'},
  {tab: 'Dua', icon: 'dua', key: 'dua'},
  {tab: 'Salat', icon: 'salat', key: 'salat'},
  {tab: 'Tools', icon: 'tools', key: 'tools'},
] as const satisfies readonly {tab: string; icon: IconName; key: string}[];

export default function HomeScreen() {
  const {t, theme, settings} = useSettings();
  const nav = useNavigation<any>();
  const focused = useIsFocused();
  const bn = settings.language === 'bn';
  const locale = bn ? 'bn-BD' : 'en-US';
  const [ctx, setCtx] = useState<SalatContext | null>(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(new Date());

  // Re-read on every visit: the place may have changed on the Salat screen.
  const reload = useCallback(async () => {
    setCtx(await loadSalatContext());
    setNow(new Date());
    AsyncStorage.getItem('tools.hijri.offset.v1')
      .then(raw => setOffset(parseInt(raw || '0', 10) || 0))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (focused) {
      reload();
    }
  }, [focused, reload]);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  const win = useMemo(
    () => (ctx?.coords ? prayerWindow(ctx.coords, ctx.prefs, now) : null),
    [ctx, now],
  );
  const fmt = (d: Date) => formatTime(d, locale, ctx?.timeZone);
  const name = (r: Row) => t.salat[r];
  const num = (n: number) => n.toLocaleString(locale, {useGrouping: false});

  let remaining = '';
  if (win) {
    const mins = Math.max(0, Math.round((win.next.at.getTime() - now.getTime()) / 60000));
    const h = Math.floor(mins / 60);
    remaining = h > 0 ? `${num(h)} ${t.home.h} ${num(mins % 60)} ${t.home.m}` : `${num(mins)} ${t.home.m}`;
  }

  const hijri = toHijri(now, offset);
  const months = t.tools.months as unknown as string[];

  return (
    <Screen title={t.home.title} onRefresh={reload}>
      <View style={[styles.hero, {backgroundColor: theme.primary}]}>
        <Text style={[styles.heroSmall, {color: theme.onPrimary}]} numberOfLines={1}>
          {num(hijri.day)} {months[hijri.month - 1]} {num(hijri.year)} ·{' '}
          {now.toLocaleDateString(locale, {weekday: 'short', day: 'numeric', month: 'short'})}
          {ctx?.place ? ` · 📍 ${ctx.place}` : ''}
        </Text>

        {win ? (
          <>
            <View style={styles.nextRow}>
              <Text style={[styles.nextName, {color: theme.onPrimary}]}>
                {t.home.next}: {name(win.next.row)}
              </Text>
              <Text style={[styles.nextTime, {color: theme.onPrimary}]}>{fmt(win.next.at)}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, {width: `${Math.round(win.progress * 100)}%`, backgroundColor: theme.onPrimary}]} />
            </View>
            <View style={styles.between}>
              <Text style={[styles.heroSmall, {color: theme.onPrimary}]}>
                {name(win.prev.row)} {fmt(win.prev.at)}
              </Text>
              <Text style={[styles.heroSmall, {color: theme.onPrimary, fontWeight: '700'}]}>
                {remaining} {t.home.remaining}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.nextName, {color: theme.onPrimary, fontSize: 16, marginTop: 4}]}>
              {t.home.setLocation}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => nav.navigate('Salat')}
              style={[styles.cta, {backgroundColor: theme.onPrimary}]}>
              <Text style={{color: theme.primary, fontWeight: '700'}}>{t.home.openSalat}</Text>
            </Pressable>
          </>
        )}
      </View>

      {win && (
        <>
          <Text style={[styles.heading, {color: theme.text}]}>{t.home.today}</Text>
          <View style={styles.times}>
            {ROWS.map(r => {
              const on = r === win.next.row;
              return (
                <View
                  key={r}
                  style={[
                    styles.timeCell,
                    {borderColor: on ? theme.primary : theme.border, backgroundColor: on ? theme.primary : theme.surface},
                  ]}>
                  <Text style={{color: on ? theme.onPrimary : theme.textMuted, fontSize: 12}}>{name(r)}</Text>
                  <Text style={{color: on ? theme.onPrimary : theme.text, fontWeight: '700', fontSize: 14}}>
                    {fmt(win.today[r])}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      <Text style={[styles.heading, {color: theme.text}]}>{t.home.quick}</Text>
      <View style={styles.grid}>
        {SHORTCUTS.map(s => (
          <Pressable
            key={s.tab}
            accessibilityRole="button"
            onPress={() => nav.navigate(s.tab)}
            style={[styles.tile, {backgroundColor: theme.surface, borderColor: theme.border}]}>
            <Icon name={s.icon} color={theme.primary} size={30} />
            <Text style={{color: theme.text, fontWeight: '600'}}>{t.tabs[s.key]}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 6, marginBottom: 12},
  heroSmall: {fontSize: 13, opacity: 0.9},
  nextRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  nextName: {flexShrink: 1, fontSize: 20, fontWeight: '700', lineHeight: 28},
  nextTime: {fontSize: 20, fontWeight: '700'},
  track: {height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden'},
  fill: {height: 8, borderRadius: 4},
  between: {flexDirection: 'row', justifyContent: 'space-between'},
  cta: {alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10, marginTop: 6},
  heading: {fontSize: 17, fontWeight: '700', marginBottom: 8, marginTop: 4},
  times: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
  timeCell: {width: '31.5%', borderWidth: 1, borderRadius: 12, paddingVertical: 8, alignItems: 'center'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  tile: {width: '48%', borderWidth: 1, borderRadius: 16, paddingVertical: 18, alignItems: 'center', gap: 6},
  icon: {fontSize: 28},
});
