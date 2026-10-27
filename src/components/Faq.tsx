import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSettings} from '../state/settings';

type Colors = {text: string; textMuted: string; border: string; primary: string};

// `colors` overrides the app theme (the Listen tab is always dark).
export default function Faq({title, items, colors}: {title: string; items: {q: string; a: string}[]; colors?: Colors}) {
  const app = useSettings().theme;
  const theme = colors ?? app;
  const [open, setOpen] = useState<number | null>(null);
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={[styles.title, {color: theme.text}]}>
        {title}
      </Text>
      {items.map((it, i) => {
        const expanded = open === i;
        return (
          <View key={it.q} style={[styles.item, {borderColor: theme.border}]}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{expanded}}
              onPress={() => setOpen(expanded ? null : i)}
              style={styles.q}>
              <Text style={{flex: 1, color: theme.text, fontSize: 16, lineHeight: 26}}>{it.q}</Text>
              <Text style={{color: theme.primary, fontSize: 20}}>{expanded ? '−' : '+'}</Text>
            </Pressable>
            {expanded && <Text style={{color: theme.textMuted, fontSize: 15, lineHeight: 26, paddingBottom: 12}}>{it.a}</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {marginTop: 24},
  title: {fontSize: 18, fontWeight: '700', marginBottom: 8, lineHeight: 30},
  item: {borderBottomWidth: StyleSheet.hairlineWidth},
  q: {minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8},
});
