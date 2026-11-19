import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import BackLink from '../../components/BackLink';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import {useSettings} from '../../state/settings';
import {FIVE, FivePrayer, PrayerLog, dayKey as keyOf, loadPrayerLog, prayedCount, prayerStreak, savePrayerLog} from '../../tools/prayerLog';

// A daily checklist of the five prayers, with the last week and the current streak of full days.
export default function PrayerLogTool({onBack}: {onBack: () => void}) {
  const {t, theme, settings} = useSettings();
  const locale = settings.language === 'bn' ? 'bn-BD' : 'en-US';
  const [log, setLog] = useState<PrayerLog>({});
  const today = keyOf(new Date());

  useEffect(() => {
    loadPrayerLog().then(setLog);
  }, []);

  const toggle = (p: FivePrayer) => {
    const next = {...log, [today]: {...log[today], [p]: !log[today]?.[p]}};
    setLog(next);
    savePrayerLog(next);
  };
  const count = (k: string) => prayedCount(log, k);
  const days = Array.from({length: 7}, (_, i) => new Date(Date.now() - (6 - i) * 86400000));
  const streak = prayerStreak(log);

  return (
    <Screen title={t.tools.prayerLog}>
      <BackLink onBack={onBack} />
      <View style={[styles.hero, {backgroundColor: theme.primary}]}>
        <Text style={{color: theme.onPrimary, opacity: 0.85}}>{t.tools.streak}</Text>
        <Text style={{color: theme.onPrimary, fontSize: 38, fontWeight: '800'}}>{streak}</Text>
        <Text style={{color: theme.onPrimary, opacity: 0.85}}>{count(today)}/5 {t.tools.today}</Text>
      </View>
      {FIVE.map(p => {
        const on = !!log[today]?.[p];
        return (
          <Pressable
            key={p}
            accessibilityRole="checkbox"
            accessibilityState={{checked: on}}
            onPress={() => toggle(p)}
            style={[styles.row, {backgroundColor: theme.surface, borderColor: on ? theme.primary : theme.border}]}>
            <View style={[styles.box, {borderColor: theme.primary, backgroundColor: on ? theme.primary : 'transparent'}]}>
              {on && <Icon name="check" color={theme.onPrimary} size={18} strokeWidth={2.4} />}
            </View>
            <Text style={{color: theme.text, fontSize: 18, fontWeight: '600'}}>{t.salat[p]}</Text>
          </Pressable>
        );
      })}
      <Text style={{color: theme.textMuted, marginTop: 10, marginBottom: 6}}>{t.tools.lastWeek}</Text>
      <View style={styles.week}>
        {days.map(d => {
          const n = count(keyOf(d));
          return (
            <View key={keyOf(d)} style={styles.day}>
              <View style={[styles.dot, {backgroundColor: n === 5 ? theme.primary : n > 0 ? theme.textMuted : theme.border}]}>
                <Text style={{color: theme.onPrimary, fontSize: 12, fontWeight: '700'}}>{n}</Text>
              </View>
              <Text style={{color: theme.textMuted, fontSize: 11}}>
                {d.toLocaleDateString(locale, {weekday: 'short'})}
              </Text>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 14},
  row: {flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 8},
  box: {width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  week: {flexDirection: 'row', justifyContent: 'space-between'},
  day: {alignItems: 'center', gap: 4},
  dot: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
});
