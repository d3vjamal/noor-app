import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import BackLink from '../../components/BackLink';
import Screen from '../../components/Screen';
import {useSettings} from '../../state/settings';

type Step = {title: string; text?: string; arabic?: string; count?: number};

// Step-by-step guides with a tick on each step (wudu, salah and the dhikr after prayer).
export default function GuideTool({title, steps, onBack}: {title: string; steps: Step[]; onBack: () => void}) {
  const {theme} = useSettings();
  const [done, setDone] = useState<Record<number, boolean>>({});
  return (
    <Screen title={title}>
      <BackLink onBack={onBack} />
      {steps.map((s, i) => {
        const on = !!done[i];
        return (
          <Pressable
            key={i}
            accessibilityRole="checkbox"
            accessibilityState={{checked: on}}
            onPress={() => setDone(d => ({...d, [i]: !d[i]}))}
            style={[styles.card, {backgroundColor: theme.surface, borderColor: on ? theme.primary : theme.border, opacity: on ? 0.65 : 1}]}>
            <View style={[styles.num, {backgroundColor: on ? theme.primary : 'transparent', borderColor: theme.primary}]}>
              <Text style={{color: on ? theme.onPrimary : theme.primary, fontWeight: '800'}}>{on ? '✓' : i + 1}</Text>
            </View>
            <View style={{flex: 1, gap: 4}}>
              <Text style={{color: theme.text, fontSize: 16, fontWeight: '700'}}>
                {s.title}
                {s.count ? `  ×${s.count}` : ''}
              </Text>
              {!!s.arabic && <Text style={[styles.arabic, {color: theme.text}]}>{s.arabic}</Text>}
              {!!s.text && <Text style={{color: theme.textMuted, lineHeight: 22}}>{s.text}</Text>}
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 8},
  num: {width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  arabic: {fontSize: 22, lineHeight: 38, textAlign: 'right'},
});
