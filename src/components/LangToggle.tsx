import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSettings} from '../state/settings';

export type TextLang = 'bn' | 'ur' | 'en';
export const LANG_ORDER: TextLang[] = ['bn', 'ur', 'en'];
export const LANG_LABEL: Record<TextLang, string> = {bn: 'বাংলা', ur: 'اردو', en: 'English'};

// Any mix of languages can be on; at least one stays on.
export function toggleLang(cur: TextLang[], k: TextLang): TextLang[] {
  if (cur.includes(k)) {
    return cur.length > 1 ? cur.filter(x => x !== k) : cur;
  }
  return [...cur, k];
}

type Props = {langs: TextLang[]; onToggle: (k: TextLang) => void};

export default function LangToggle({langs, onToggle}: Props) {
  const {theme} = useSettings();
  return (
    <View style={[styles.bar, {borderBottomColor: theme.border}]}>
      {LANG_ORDER.map(k => {
        const on = langs.includes(k);
        return (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityState={{selected: on}}
            onPress={() => onToggle(k)}
            style={[
              styles.btn,
              {borderColor: on ? theme.primary : theme.border},
              on && {backgroundColor: theme.primary},
            ]}>
            <Text style={[styles.label, {color: on ? theme.onPrimary : theme.text}]}>
              {LANG_LABEL[k]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  btn: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: {fontSize: 15, fontWeight: '600'},
});
