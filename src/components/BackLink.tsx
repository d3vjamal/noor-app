import React from 'react';
import {Pressable, Text} from 'react-native';
import {useSettings} from '../state/settings';

export default function BackLink({onBack}: {onBack: () => void}) {
  const {theme, t} = useSettings();
  return (
    <Pressable accessibilityRole="button" onPress={onBack} style={{paddingBottom: 12}}>
      <Text style={{color: theme.primary, fontSize: 16}}>← {t.tools.title}</Text>
    </Pressable>
  );
}
