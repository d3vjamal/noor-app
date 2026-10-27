import React, {useEffect, useState} from 'react';
import {BackHandler, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useAudioQueue} from '../audio/useAudioQueue';
import Icon, {IconName} from '../components/Icon';
import Screen, {EmptyState} from '../components/Screen';
import ShareBar from '../components/ShareBar';
import {useDuas} from '../content/duas';
import {useSettings} from '../state/settings';

type Cat = string;
// Display order and icon of each category; a category with no duas is hidden.
const CATS: {key: Cat; icon: IconName}[] = [
  {key: 'morning', icon: 'sun'},
  {key: 'evening', icon: 'moon'},
  {key: 'daily', icon: 'sun'},
  {key: 'wudu', icon: 'drop'},
  {key: 'prayer', icon: 'mosque'},
  {key: 'after_prayer', icon: 'tasbih'},
  {key: 'night_prayer', icon: 'moon'},
  {key: 'sleep', icon: 'moon'},
  {key: 'food', icon: 'food'},
  {key: 'home', icon: 'house'},
  {key: 'masjid', icon: 'mosque'},
  {key: 'travel', icon: 'compass'},
  {key: 'hajj', icon: 'qibla'},
  {key: 'forgiveness', icon: 'heart'},
  {key: 'distress', icon: 'heart'},
  {key: 'grief', icon: 'heart'},
  {key: 'illness', icon: 'heart'},
  {key: 'protection', icon: 'shield'},
  {key: 'guidance', icon: 'names'},
  {key: 'gratitude', icon: 'names'},
  {key: 'dhikr', icon: 'tasbih'},
  {key: 'quran_recitation', icon: 'library'},
  {key: 'knowledge', icon: 'library'},
  {key: 'parents', icon: 'house'},
  {key: 'marriage', icon: 'heart'},
  {key: 'children', icon: 'heart'},
  {key: 'business', icon: 'zakat'},
  {key: 'weather', icon: 'cloud'},
];

// Categories first, then the duas of one category (or all of them).
export default function DuaScreen() {
  const {t, theme, settings} = useSettings();
  const lang = settings.language;
  const [cat, setCat] = useState<Cat | 'all' | null>(null);
  const {data, loading, refresh, refreshing} = useDuas();
  const audio = useAudioQueue();
  const stopAudio = audio.stop;
  const all = data ?? [];
  const [query, setQuery] = useState('');
  const catName = (c: Cat | 'all') =>
    c === 'all' ? t.dua.all : (t.dua.cats as Record<string, string>)[c] ?? c;

  // Android back returns to the category grid and stops any recitation.
  useEffect(() => {
    if (!cat) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      stopAudio();
      setCat(null);
      return true;
    });
    return () => sub.remove();
  }, [cat, stopAudio]);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const showGrid = !cat && !searching;
  const tiles: {key: Cat | 'all'; icon: IconName; count: number}[] = [
    {key: 'all', icon: 'grid', count: all.length},
    ...CATS.map(c => ({...c, count: all.filter(d => d.category === c.key).length})).filter(c => c.count > 0),
  ];
  const list = searching
    ? all.filter(d =>
        [d.title.en, d.title[lang], d.meaning.en, d.meaning[lang], d.transliteration ?? '', d.arabic].some(f =>
          f.toLowerCase().includes(q),
        ),
      )
    : all.filter(d => cat === 'all' || d.category === cat);

  // One Screen for grid, category and search results, so the search box keeps focus while typing.
  return (
    <Screen title={t.tabs.dua} onRefresh={refresh} refreshing={refreshing}>
      {!all.length && <EmptyState text={loading ? t.common.loading : t.common.needInternet} />}
      {(showGrid || searching) && !!all.length && (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.dua.search}
          placeholderTextColor={theme.textMuted}
          style={[styles.search, {color: theme.text, borderColor: theme.border, backgroundColor: theme.surface}]}
        />
      )}

      {showGrid && (
        <View style={styles.grid}>
          {tiles.map(x => (
            <Pressable
              key={x.key}
              accessibilityRole="button"
              onPress={() => setCat(x.key)}
              style={[styles.tile, {backgroundColor: theme.surface, borderColor: theme.border}]}>
              <View style={[styles.iconWrap, {backgroundColor: theme.background}]}>
                <Icon name={x.icon} color={theme.primary} size={30} />
              </View>
              <Text style={[styles.tileTitle, {color: theme.text}]}>{catName(x.key)}</Text>
              <Text style={{color: theme.textMuted, fontSize: 12}}>{t.dua.count.replace('%d', x.count.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {useGrouping: false}))}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {!showGrid && !searching && cat && (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            audio.stop();
            setCat(null);
          }}
          style={styles.back}>
          <Text style={{color: theme.primary, fontSize: 16}}>← {catName(cat)}</Text>
        </Pressable>
      )}
      {!showGrid && audio.failed && <Text style={[styles.err, {color: theme.textMuted}]}>{t.dua.audioFailed}</Text>}
      {searching && !list.length && <EmptyState text={t.dua.noResults} />}

      {!showGrid &&
        list.map(d => {
          const playing = audio.key === d.id;
          return (
            <View key={d.id} style={[styles.card, {backgroundColor: theme.surface, borderColor: playing ? theme.primary : theme.border}]}>
              <Text style={[styles.title, {color: theme.primary}]}>{d.title[lang]}</Text>
              <Text style={[styles.arabic, {color: theme.text}]}>{d.arabic}</Text>
              {!!d.transliteration && <Text style={[styles.translit, {color: theme.textMuted}]}>{d.transliteration}</Text>}
              <Text style={[styles.meaning, {color: theme.textMuted}]}>{d.meaning[lang]}</Text>
              <View style={[styles.rule, {backgroundColor: theme.border}]} />
              <Text style={[styles.source, {color: theme.textMuted}]}>
                {t.tools.source}: {d.source[lang]}
                {d.repeat ? `  ·  ${t.dua.repeat.replace('%d', String(d.repeat))}` : ''}
              </Text>
              <View style={styles.actions}>
                {!!d.audioUrls?.length && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={playing ? t.dua.stop : t.dua.play}
                    onPress={() => (playing ? audio.stop() : audio.play(d.id, d.audioUrls!))}
                    style={[styles.play, {backgroundColor: theme.primary}]}>
                    <Icon name={playing ? 'stop' : 'play'} color={theme.onPrimary} size={16} />
                    <Text style={{color: theme.onPrimary, fontWeight: '700'}}>
                      {playing ? (audio.loading ? t.common.loading : t.dua.stop) : t.dua.play}
                    </Text>
                  </Pressable>
                )}
                <ShareBar
                  text={() =>
                    `${d.title[lang]}\n\n${d.arabic}\n\n${d.transliteration ? d.transliteration + '\n\n' : ''}${d.meaning[lang]}\n\n${t.tools.source}: ${d.source[lang]}`
                  }
                />
              </View>
            </View>
          );
        })}
      {audio.element}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  tile: {width: '30%', borderWidth: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', gap: 6},
  iconWrap: {width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center'},
  tileTitle: {fontSize: 14, fontWeight: '700', textAlign: 'center'},
  back: {paddingBottom: 12},
  search: {borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, marginBottom: 12},
  translit: {fontSize: 14, fontStyle: 'italic', marginBottom: 6},
  err: {marginBottom: 8},
  card: {borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 12},
  title: {fontSize: 17, fontWeight: '700', marginBottom: 4},
  arabic: {fontSize: 26, lineHeight: 46, textAlign: 'right', marginVertical: 10},
  meaning: {fontSize: 16, lineHeight: 26},
  rule: {height: StyleSheet.hairlineWidth, marginVertical: 10},
  source: {fontSize: 13, fontStyle: 'italic', marginBottom: 8},
  actions: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8},
  play: {flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7},
});
