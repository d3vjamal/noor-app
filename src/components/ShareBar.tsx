import React, {useEffect, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Icon, {IconName} from './Icon';
import {useSettings} from '../state/settings';
import {copyText, shareText, whatsappText} from '../share';

// Copy / WhatsApp / Share row under a hadith, dua or ayah. `text` is built lazily from what is on screen.
export default function ShareBar({text}: {text: () => string}) {
  const {t, theme, appName} = useSettings();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const body = () => `${text()}\n\n— ${appName}`;
  const actions = [
    {
      key: 'copy',
      icon: (copied ? 'check' : 'copy') as IconName,
      label: copied ? t.common.copied : t.common.copy,
      run: () => {
        copyText(body());
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1500);
      },
    },
    {key: 'wa', icon: 'whatsapp' as IconName, label: t.common.whatsapp, run: () => whatsappText(body())},
    {key: 'share', icon: 'share' as IconName, label: t.common.share, run: () => shareText(body())},
  ];
  return (
    <View style={styles.row}>
      {actions.map(a => (
        <Pressable
          key={a.key}
          accessibilityRole="button"
          onPress={a.run}
          style={[styles.btn, {borderColor: theme.border}]}>
          <Icon name={a.icon} color={theme.primary} size={15} />
          <Text style={{color: theme.primary, fontSize: 13, fontWeight: '600'}}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4},
  btn: {flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6},
});
