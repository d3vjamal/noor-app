import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import BackLink from '../../components/BackLink';
import Screen from '../../components/Screen';
import {useSettings} from '../../state/settings';

const PAGES = 604; // standard Madinah mushaf
const AYAHS = 6236;
const PRESETS = [7, 15, 30, 60, 90, 180, 365];

// Plans how much to read each day to finish the Quran in a chosen number of days.
export default function KhatamTool({onBack}: {onBack: () => void}) {
  const {t, theme, settings} = useSettings();
  const locale = settings.language === 'bn' ? 'bn-BD' : 'en-US';
  const [days, setDays] = useState(30);
  const n = Math.max(1, days);
  const pages = Math.ceil(PAGES / n);
  const ayahs = Math.ceil(AYAHS / n);
  const end = new Date(Date.now() + n * 86400000);
  const stat = (label: string, value: string) => (
    <View style={[styles.stat, {backgroundColor: theme.surface, borderColor: theme.border}]}>
      <Text style={{color: theme.textMuted, fontSize: 13}}>{label}</Text>
      <Text style={{color: theme.text, fontSize: 22, fontWeight: '800'}}>{value}</Text>
    </View>
  );
  return (
    <Screen title={t.tools.khatam}>
      <BackLink onBack={onBack} />
      <Text style={{color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 8}}>{t.tools.khatamQ}</Text>
      <View style={styles.chips}>
        {PRESETS.map(d => {
          const on = d === days;
          return (
            <Pressable
              key={d}
              onPress={() => setDays(d)}
              style={[styles.chip, {borderColor: on ? theme.primary : theme.border, backgroundColor: on ? theme.primary : 'transparent'}]}>
              <Text style={{color: on ? theme.onPrimary : theme.text}}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        keyboardType="number-pad"
        value={String(days)}
        onChangeText={v => setDays(parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)}
        style={[styles.input, {color: theme.text, borderColor: theme.border, backgroundColor: theme.surface}]}
      />
      <View style={styles.grid}>
        {stat(t.tools.pagesPerDay, String(pages))}
        {stat(t.tools.ayahsPerDay, String(ayahs))}
        {stat(t.tools.perPrayer, String(Math.ceil(pages / 5)))}
        {stat(
          t.tools.finishOn,
          end.toLocaleDateString(locale, {day: 'numeric', month: 'short', year: 'numeric'}),
        )}
      </View>
      <Text style={{color: theme.textMuted, marginTop: 4}}>{t.tools.khatamNote}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
  chip: {borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8},
  input: {borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 20, marginBottom: 14},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  stat: {width: '48%', borderWidth: 1, borderRadius: 14, padding: 14, gap: 4},
});
