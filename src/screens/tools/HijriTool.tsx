import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackLink from '../../components/BackLink';
import Screen from '../../components/Screen';
import {useSettings} from '../../state/settings';
import {OCCASIONS, daysInMonth, fromHijri, toHijri} from '../../tools/hijri';

const OFFSET_KEY = 'tools.hijri.offset.v1';

export default function HijriTool({onBack}: {onBack: () => void}) {
  const {t, theme, settings} = useSettings();
  const bn = settings.language === 'bn';
  const num = (n: number) => (bn ? String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]) : String(n));
  const [offset, setOffset] = useState(0);
  const today = new Date();
  const [view, setView] = useState<{year: number; month: number} | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(OFFSET_KEY)
      .then(raw => raw && setOffset(parseInt(raw, 10) || 0))
      .catch(() => {});
  }, []);
  const adjust = (d: number) => {
    const next = Math.max(-2, Math.min(2, offset + d));
    setOffset(next);
    setView(null);
    AsyncStorage.setItem(OFFSET_KEY, String(next)).catch(() => {});
  };

  const now = toHijri(today, offset);
  const shown = view ?? {year: now.year, month: now.month};
  const step = (d: number) => {
    const m = shown.month + d;
    setView({year: shown.year + (m < 1 ? -1 : m > 12 ? 1 : 0), month: m < 1 ? 12 : m > 12 ? 1 : m});
  };

  // Weekday of the 1st decides the grid's leading blanks. The user offset moves the whole month.
  const cells = useMemo(() => {
    const first = fromHijri({...shown, day: 1});
    first.setDate(first.getDate() - offset);
    const lead = first.getDay();
    const len = daysInMonth(shown.year, shown.month);
    return [...Array(lead).fill(0), ...Array.from({length: len}, (_, i) => i + 1)] as number[];
  }, [shown.year, shown.month, offset]); // eslint-disable-line react-hooks/exhaustive-deps

  const events = OCCASIONS.filter(o => o.month === shown.month);
  const monthName = (m: number) => (t.tools.months as unknown as string[])[m - 1];
  const weekdays = t.tools.weekdays as unknown as string[];

  return (
    <Screen title={t.tools.hijri}>
      <BackLink onBack={onBack} />
      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={{color: theme.textMuted}}>{t.tools.today}</Text>
        <Text style={[styles.big, {color: theme.primary}]}>
          {num(now.day)} {monthName(now.month)} {num(now.year)}
        </Text>
        <Text style={{color: theme.textMuted}}>
          {today.toLocaleDateString(bn ? 'bn-BD' : 'en-GB', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
        </Text>
      </View>

      <View style={styles.nav}>
        <Pressable accessibilityRole="button" onPress={() => step(-1)} style={styles.navBtn}>
          <Text style={{color: theme.primary, fontSize: 24}}>‹</Text>
        </Pressable>
        <Text style={{color: theme.text, fontSize: 18, fontWeight: '700'}}>
          {monthName(shown.month)} {num(shown.year)}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => step(1)} style={styles.navBtn}>
          <Text style={{color: theme.primary, fontSize: 24}}>›</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {weekdays.map(w => (
          <Text key={w} style={[styles.cell, {color: theme.textMuted}]}>{w}</Text>
        ))}
        {cells.map((d, i) => {
          const isToday = d === now.day && shown.year === now.year && shown.month === now.month;
          const special = events.some(e => e.day === d);
          return (
            <View key={i} style={styles.cell}>
              {d > 0 && (
                <View
                  style={[
                    styles.day,
                    isToday && {backgroundColor: theme.primary},
                    special && !isToday && {borderColor: theme.primary, borderWidth: 1},
                  ]}>
                  <Text style={{color: isToday ? theme.onPrimary : theme.text}}>{num(d)}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {events.length > 0 && (
        <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
          <Text style={[styles.heading, {color: theme.text}]}>{t.tools.occasions}</Text>
          {events.map(e => (
            <Text key={e.key} style={{color: theme.text, marginTop: 4}}>
              {num(e.day)} {monthName(e.month)}: {t.tools[e.key as keyof typeof t.tools] as string}
            </Text>
          ))}
        </View>
      )}

      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={[styles.heading, {color: theme.text}]}>{t.tools.adjust}</Text>
        <View style={styles.nav}>
          <Pressable accessibilityRole="button" onPress={() => adjust(-1)} style={styles.navBtn}>
            <Text style={{color: theme.primary, fontSize: 24}}>−</Text>
          </Pressable>
          <Text style={{color: theme.text, fontSize: 16}}>
            {offset > 0 ? '+' : ''}{num(offset)} {t.tools.days}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => adjust(1)} style={styles.navBtn}>
            <Text style={{color: theme.primary, fontSize: 24}}>+</Text>
          </Pressable>
        </View>
        <Text style={{color: theme.textMuted, fontSize: 13}}>{t.tools.hijriNote}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12},
  big: {fontSize: 26, fontWeight: '700', marginVertical: 4},
  heading: {fontSize: 16, fontWeight: '700'},
  nav: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6},
  navBtn: {minWidth: 48, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12},
  cell: {width: '14.285%', alignItems: 'center', paddingVertical: 4, textAlign: 'center'},
  day: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
});
