import React, {useCallback, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSettings} from '../state/settings';
import LibraryScreen from './LibraryScreen';
import ListenScreen from './ListenScreen';

type Mode = 'read' | 'listen';

// One tab for reading and listening. Both stay mounted so audio keeps playing when you switch;
// the switch itself hides while a reader or player owns the whole screen.
export default function LibraryHubScreen() {
  const {t, theme} = useSettings();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('read');
  const [immersive, setImmersive] = useState<Record<Mode, boolean>>({read: false, listen: false});
  const onRead = useCallback((on: boolean) => setImmersive(s => (s.read === on ? s : {...s, read: on})), []);
  const onListen = useCallback((on: boolean) => setImmersive(s => (s.listen === on ? s : {...s, listen: on})), []);

  const showBar = !immersive[mode];
  const options: {key: Mode; label: string}[] = [
    {key: 'read', label: t.library.segRead},
    {key: 'listen', label: t.tabs.listen},
  ];
  return (
    <View style={[styles.root, {backgroundColor: theme.background, paddingTop: showBar ? insets.top : 0}]}>
      {showBar && (
        <View style={[styles.bar, {borderBottomColor: theme.border}]}>
          {options.map(o => {
            const on = o.key === mode;
            return (
              <Pressable
                key={o.key}
                accessibilityRole="tab"
                accessibilityState={{selected: on}}
                onPress={() => setMode(o.key)}
                style={[styles.seg, {backgroundColor: on ? theme.primary : theme.surface, borderColor: on ? theme.primary : theme.border}]}>
                <Text style={{color: on ? theme.onPrimary : theme.text, fontWeight: '700', fontSize: 16}}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={[styles.body, mode !== 'read' && styles.hidden]}>
        <LibraryScreen embedded={showBar || mode !== 'read'} onImmersive={onRead} />
      </View>
      <View style={[styles.body, mode !== 'listen' && styles.hidden]}>
        <ListenScreen embedded={showBar || mode !== 'listen'} onImmersive={onListen} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  bar: {flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth},
  seg: {flex: 1, minHeight: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  body: {flex: 1},
  hidden: {display: 'none'},
});
