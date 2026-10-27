import React, {useEffect, useMemo, useState} from 'react';
import {
  BackHandler,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import PlaylistPlayer from '../components/PlaylistPlayer';
import {Playlist} from '../content/types';
import {usePlaylists} from '../content/playlists';
import {useQuotes} from '../content/names';
import {useSettings} from '../state/settings';
import {Radio, useRadio} from '../theme/radio';

type Provider = Playlist['provider'];
const TABS: {key: Provider; label: string}[] = [
  {key: 'youtube', label: 'YouTube'},
  {key: 'spotify', label: 'Spotify'},
];

type Props = {embedded?: boolean; onImmersive?: (on: boolean) => void};

export default function ListenScreen({embedded = false, onImmersive}: Props) {
  const radio = useRadio();
  const styles = useMemo(() => makeStyles(radio), [radio]);
  const {t, settings} = useSettings();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const {items: playlists, refresh, refreshing} = usePlaylists();
  const [current, setCurrent] = useState<Playlist | null>(null);
  const [tab, setTab] = useState<Provider>('youtube');

  // A player is open: the hub hides its own switch.
  const immersive = !!current;
  useEffect(() => {
    onImmersive?.(immersive);
  }, [immersive, onImmersive]);

  // Open on the first provider that actually has playlists.
  useEffect(() => {
    if (!playlists.some(p => p.provider === tab) && playlists.length) {
      setTab(playlists[0].provider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlists]);

  // Android back closes the player instead of leaving the tab.
  useEffect(() => {
    if (!current) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setCurrent(null);
      return true;
    });
    return () => sub.remove();
  }, [current]);

  // Rotates daily; hidden while the quotes table is empty.
  const quotes = useQuotes().data ?? [];
  const quote = quotes.length
    ? quotes[Math.floor(Date.now() / 86400000) % quotes.length]
    : null;

  const items = playlists.filter(p => p.provider === tab);
  const nameOf = (p: Playlist) =>
    settings.language === 'en' && p.titleEn ? p.titleEn : p.title;

  return (
    <View style={[styles.root, {paddingTop: embedded && !current ? 0 : insets.top}]}>
      {focused && (
        <StatusBar barStyle={radio.statusBar} backgroundColor={radio.bg} />
      )}
      {current ? (
        <PlaylistPlayer playlist={current} onBack={() => setCurrent(null)} />
      ) : (
        <>
          {!embedded && (
            <Text accessibilityRole="header" style={styles.header}>
              {t.listen.title}
            </Text>
          )}
          <View style={styles.tabs}>
            {TABS.map(x => {
              const on = tab === x.key;
              return (
                <Pressable
                  key={x.key}
                  accessibilityRole="tab"
                  accessibilityState={{selected: on}}
                  onPress={() => setTab(x.key)}
                  style={[styles.tab, on && styles.tabOn]}>
                  <Text style={[styles.tabText, on && {color: radio.onAccent}]}>
                    {x.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <ScrollView
            contentContainerStyle={styles.body}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                colors={[radio.amber]}
                tintColor={radio.amber}
              />
            }>
            {items.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.listen.playRadio}
                onPress={() => setCurrent(items[0])}
                style={styles.hero}>
                <Text style={styles.heroKicker}>{t.listen.radio}</Text>
                <Text style={styles.heroTitle}>{t.listen.playRadio} ▶</Text>
                <Text style={styles.heroHint}>{t.listen.radioHint}</Text>
              </Pressable>
            )}
            {items.length === 0 && (
              <Text style={styles.empty}>{t.listen.empty}</Text>
            )}
            {quote && (
              <View style={styles.card}>
                <Text style={styles.muted}>{t.listen.quoteTitle}</Text>
                <Text style={{color: radio.text, fontSize: 17, lineHeight: 30}}>
                  {quote.text}
                </Text>
                {!!quote.source && (
                  <Text style={styles.muted}>{quote.source}</Text>
                )}
              </View>
            )}
            {items.map(p => (
              <Pressable
                key={p.slug}
                accessibilityRole="button"
                accessibilityLabel={nameOf(p)}
                onPress={() => setCurrent(p)}
                style={[styles.card, styles.row]}>
                {p.thumbnail ? (
                  <Image source={{uri: p.thumbnail}} style={styles.thumb} />
                ) : (
                  <View style={styles.thumb} />
                )}
                <View style={{flex: 1}}>
                  <Text style={styles.rowTitle}>{nameOf(p)}</Text>
                  <Text style={styles.muted}>
                    {p.type === 'audio' ? t.listen.audio : t.listen.video}
                  </Text>
                </View>
                <Text style={{color: radio.amber, fontSize: 28}}>▶</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const makeStyles = (radio: Radio) =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: radio.bg},
    header: {
      color: radio.text,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 36,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    tabs: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    tab: {
      height: 40,
      paddingHorizontal: 20,
      borderRadius: 20,
      justifyContent: 'center',
      backgroundColor: radio.glass,
      borderColor: radio.glassBorder,
      borderWidth: 1,
    },
    tabOn: {backgroundColor: radio.amber, borderColor: radio.amberHi},
    tabText: {color: radio.text, fontSize: 15, fontWeight: '600'},
    body: {padding: 16, paddingTop: 4, flexGrow: 1},
    hero: {
      padding: 18,
      borderRadius: 20,
      marginBottom: 16,
      gap: 4,
      minHeight: 100,
      justifyContent: 'center',
      backgroundColor: radio.amber,
    },
    heroKicker: {color: radio.onAccent, fontSize: 13, letterSpacing: 1},
    heroTitle: {
      color: radio.onAccent,
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 32,
    },
    heroHint: {color: radio.onAccent, fontSize: 14, lineHeight: 22},
    card: {
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: radio.glassBorder,
      backgroundColor: radio.glass,
      marginBottom: 12,
      gap: 6,
    },
    row: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72},
    thumb: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: radio.disc,
    },
    rowTitle: {
      color: radio.text,
      fontSize: 17,
      lineHeight: 28,
      fontWeight: '600',
    },
    muted: {color: radio.muted, fontSize: 13},
    empty: {
      color: radio.muted,
      fontSize: 16,
      lineHeight: 28,
      textAlign: 'center',
      marginTop: 32,
    },
  });
