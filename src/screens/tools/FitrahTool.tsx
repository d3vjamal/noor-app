import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import BackLink from '../../components/BackLink';
import Screen from '../../components/Screen';
import {useSettings} from '../../state/settings';

// Sadaqatul Fitr: a measure of staple food per person, paid before the Eid prayer.
const KG = [1.75, 2.5, 3];

export default function FitrahTool({onBack}: {onBack: () => void}) {
  const {t, theme} = useSettings();
  const [people, setPeople] = useState('1');
  const [price, setPrice] = useState('');
  const [kg, setKg] = useState(KG[0]);
  const count = parseInt(people, 10) || 0;
  const per = kg * (parseFloat(price) || 0);
  const total = per * count;
  const fmt = (n: number) => n.toLocaleString(undefined, {maximumFractionDigits: 2});
  const input = {color: theme.text, borderColor: theme.border, backgroundColor: theme.surface};
  return (
    <Screen title={t.tools.fitrah}>
      <BackLink onBack={onBack} />
      <Text style={{color: theme.textMuted, marginBottom: 12}}>{t.tools.fitrahNote}</Text>
      <Text style={[styles.label, {color: theme.text}]}>{t.tools.fitrahPeople}</Text>
      <TextInput
        keyboardType="number-pad"
        value={people}
        onChangeText={v => setPeople(v.replace(/[^0-9]/g, ''))}
        style={[styles.input, input]}
      />
      <Text style={[styles.label, {color: theme.text}]}>{t.tools.fitrahKg}</Text>
      <View style={styles.chips}>
        {KG.map(k => {
          const on = k === kg;
          return (
            <Pressable
              key={k}
              onPress={() => setKg(k)}
              style={[styles.chip, {borderColor: on ? theme.primary : theme.border, backgroundColor: on ? theme.primary : 'transparent'}]}>
              <Text style={{color: on ? theme.onPrimary : theme.text}}>{k} kg</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.label, {color: theme.text}]}>{t.tools.fitrahPrice}</Text>
      <TextInput
        keyboardType="decimal-pad"
        value={price}
        onChangeText={v => setPrice(v.replace(/[^0-9.]/g, ''))}
        placeholder="0"
        placeholderTextColor={theme.textMuted}
        style={[styles.input, input]}
      />
      <View style={[styles.result, {backgroundColor: theme.primary}]}>
        <Text style={{color: theme.onPrimary, opacity: 0.85}}>{t.tools.fitrahTotal}</Text>
        <Text style={{color: theme.onPrimary, fontSize: 40, fontWeight: '800'}}>{fmt(total)}</Text>
        <Text style={{color: theme.onPrimary, opacity: 0.85}}>
          {fmt(per)} × {count}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 15, fontWeight: '600', marginBottom: 6, marginTop: 4},
  input: {borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 20, marginBottom: 10},
  chips: {flexDirection: 'row', gap: 8, marginBottom: 10},
  chip: {borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8},
  result: {borderRadius: 18, padding: 20, alignItems: 'center', marginTop: 8},
});
