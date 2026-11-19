import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackLink from '../../components/BackLink';
import Screen from '../../components/Screen';
import {useSettings} from '../../state/settings';
import {toHijri} from '../../tools/hijri';

// Upcoming recommended (sunnah) fasting days, found from the Hijri calendar and the weekday.
export default function SunnahFastTool({onBack}: {onBack: () => void}) {
  const {t, theme, settings} = useSettings();
  const locale = settings.language === 'bn' ? 'bn-BD' : 'en-US';
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    AsyncStorage.getItem('tools.hijri.offset.v1')
      .then(raw => setOffset(parseInt(raw || '0', 10) || 0))
      .catch(() => {});
  }, []);

  const list = useMemo(() => {
    const out: {date: Date; why: string[]}[] = [];
    for (let i = 0; i < 120 && out.length < 24; i++) {
      const date = new Date(Date.now() + i * 86400000);
      const h = toHijri(date, offset);
      const why: string[] = [];
      if (h.month === 9) {
        continue; // Ramadan itself is obligatory
      }
      if (h.month === 12 && h.day === 9) {
        why.push(t.tools.fastArafah);
      }
      if (h.month === 1 && (h.day === 9 || h.day === 10)) {
        why.push(t.tools.fastAshura);
      }
      if (h.day >= 13 && h.day <= 15) {
        why.push(t.tools.fastWhite);
      }
      if (h.month === 10 && h.day >= 2 && h.day <= 7) {
        why.push(t.tools.fastShawwal);
      }
      const wd = date.getDay();
      if (wd === 1 || wd === 4) {
        why.push(wd === 1 ? t.tools.fastMonday : t.tools.fastThursday);
      }
      if (why.length) {
        out.push({date, why});
      }
    }
    return out;
  }, [offset, t]);

  return (
    <Screen title={t.tools.sunnahFast}>
      <BackLink onBack={onBack} />
      <Text style={{color: theme.textMuted, marginBottom: 12}}>{t.tools.sunnahFastNote}</Text>
      {list.map(x => (
        <View key={x.date.toDateString()} style={[styles.row, {backgroundColor: theme.surface, borderColor: theme.border}]}>
          <View style={[styles.date, {backgroundColor: theme.primary}]}>
            <Text style={{color: theme.onPrimary, fontSize: 20, fontWeight: '800'}}>{x.date.getDate()}</Text>
            <Text style={{color: theme.onPrimary, fontSize: 11}}>
              {x.date.toLocaleDateString(locale, {month: 'short'})}
            </Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={{color: theme.text, fontWeight: '600'}}>{x.date.toLocaleDateString(locale, {weekday: 'long'})}</Text>
            <Text style={{color: theme.textMuted, fontSize: 13}}>{x.why.join(' · ')}</Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 10, marginBottom: 8},
  date: {width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
});
