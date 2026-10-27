import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, BackHandler, FlatList, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAudioQueue} from '../audio/useAudioQueue';
import {Ayah, RECITERS, Surah, ayahAudioUrl, globalAyah, loadAyahs, useSurahs} from '../content/quran';
import Icon from './Icon';
import {useSettings} from '../state/settings';
import ShareBar from './ShareBar';
import LangToggle, {LANG_ORDER, TextLang, toggleLang} from './LangToggle';

// Two levels: the surah list, then the ayahs of one surah (Arabic plus any chosen translations).
export default function QuranReader({onBack}: {onBack: () => void}) {
  const {theme, t, settings} = useSettings();
  const insets = useSafeAreaInsets();
  const {data: surahs, loading} = useSurahs();
  const [surah, setSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [langs, setLangs] = useState<TextLang[]>([settings.language]);
  const [reciterId, setReciterId] = useState(RECITERS[0].id);
  const [startIdx, setStartIdx] = useState(0);
  const audio = useAudioQueue();
  const stopAudio = audio.stop;
  const listRef = useRef<FlatList<Ayah>>(null);
  const reciter = RECITERS.find(r => r.id === reciterId) ?? RECITERS[0];

  useEffect(() => {
    AsyncStorage.getItem('quran.reciter.v1')
      .then(v => v && setReciterId(v))
      .catch(() => {});
  }, []);

  // Plays from `from` to the end of the surah; the current ayah is startIdx + queue position.
  const playFrom = (from: number) => {
    if (!surah || !ayahs || !surahs) {
      return;
    }
    const base = globalAyah(surahs, surah.number, 1);
    setStartIdx(from);
    audio.play(`${surah.number}`, ayahs.slice(from).map(a => ayahAudioUrl(reciter, base + a.number - 1)));
  };
  const playingIdx = audio.key ? startIdx + audio.index : -1;
  const pickReciter = (id: string) => {
    audio.stop();
    setReciterId(id);
    AsyncStorage.setItem('quran.reciter.v1', id).catch(() => {});
  };

  // Follow the recitation down the page.
  useEffect(() => {
    if (playingIdx >= 0) {
      try {
        listRef.current?.scrollToIndex({index: playingIdx, animated: true, viewPosition: 0.1});
      } catch {}
    }
  }, [playingIdx]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (surah) {
        stopAudio();
        setSurah(null);
      } else {
        onBack();
      }
      return true;
    });
    return () => sub.remove();
  }, [surah, onBack, stopAudio]);

  useEffect(() => {
    setAyahs(null);
    if (!surah) {
      return;
    }
    let alive = true;
    loadAyahs(surah.number).then(rows => alive && setAyahs(rows));
    return () => {
      alive = false;
    };
  }, [surah]);

  return (
    <View style={[styles.root, {backgroundColor: theme.background, paddingTop: insets.top}]}>
      <View style={[styles.header, {borderBottomColor: theme.border}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.listen.back}
          onPress={() => {
            audio.stop();
            if (surah) {
              setSurah(null);
            } else {
              onBack();
            }
          }}
          style={styles.back}>
          <Text style={{color: theme.primary, fontSize: 24}}>←</Text>
        </Pressable>
        <Text style={[styles.title, {color: theme.text}]}>
          {surah ? `${surah.number}. ${surah.nameEn}` : t.library.tabQuran}
        </Text>
      </View>
      {surah && <LangToggle langs={langs} onToggle={k => setLangs(c => toggleLang(c, k))} />}
      {surah && (
        <View style={[styles.reciterBar, {borderBottomColor: theme.border}]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => (audio.key ? audio.stop() : playFrom(0))}
            style={[styles.playAll, {backgroundColor: theme.primary}]}>
            <Icon name={audio.key ? 'stop' : 'play'} color={theme.onPrimary} size={16} />
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reciters}>
            {RECITERS.map(r => {
              const on = r.id === reciterId;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => pickReciter(r.id)}
                  style={[styles.reciter, {borderColor: on ? theme.primary : theme.border}, on && {backgroundColor: theme.primary}]}>
                  <Text style={{color: on ? theme.onPrimary : theme.text, fontSize: 13}}>{r.name[settings.language]}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {!surah ? (
        <FlatList
          data={surahs ?? []}
          keyExtractor={s => String(s.number)}
          contentContainerStyle={{padding: 16, paddingBottom: insets.bottom + 16}}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <Text style={{color: theme.textMuted, textAlign: 'center'}}>{t.common.needInternet}</Text>
            )
          }
          renderItem={({item}) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSurah(item)}
              style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
              <Text style={[styles.num, {color: theme.primary}]}>{item.number}</Text>
              <View style={styles.flex}>
                <Text style={[styles.name, {color: theme.text}]}>{item.nameEn}</Text>
                <Text style={{color: theme.textMuted}}>
                  {item.meaningEn} · {item.revelation === 'Mecca' ? t.library.meccan : t.library.medinan} ·{' '}
                  {t.library.quranSubtitle.replace('%d', String(item.ayahCount))}
                </Text>
              </View>
              <Text style={[styles.arabicName, {color: theme.text}]}>{item.nameAr}</Text>
            </Pressable>
          )}
        />
      ) : !ayahs ? (
        <ActivityIndicator color={theme.primary} style={styles.spinner} />
      ) : !ayahs.length ? (
        <Text style={[styles.empty, {color: theme.textMuted}]}>{t.common.needInternet}</Text>
      ) : (
        <FlatList
          ref={listRef}
          onScrollToIndexFailed={() => {}}
          data={ayahs}
          keyExtractor={a => String(a.number)}
          initialNumToRender={8}
          contentContainerStyle={{padding: 16, paddingBottom: insets.bottom + 16}}
          renderItem={({item, index}) => (
            <View
              style={[
                styles.card,
                styles.ayah,
                {backgroundColor: theme.surface, borderColor: index === playingIdx ? theme.primary : theme.border},
                index === playingIdx && styles.playingCard,
              ]}>
              <Text style={[styles.ano, {color: theme.primary}]}>
                {surah.number}:{item.number}
              </Text>
              <Text style={[styles.arabic, {color: theme.text}]} selectable>
                {item.ar}
              </Text>
              {LANG_ORDER.filter(k => langs.includes(k)).map(k => (
                <Text
                  key={k}
                  selectable
                  style={[styles.tr, {color: theme.textMuted}, k === 'ur' && styles.rtl]}>
                  {item[k] ?? ''}
                </Text>
              ))}
              <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.dua.play}
                onPress={() => (index === playingIdx ? audio.stop() : playFrom(index))}
                style={[styles.playBtn, {backgroundColor: theme.primary}]}>
                <Icon name={index === playingIdx ? 'stop' : 'play'} color={theme.onPrimary} size={14} />
              </Pressable>
              <ShareBar
                text={() =>
                  [item.ar, ...LANG_ORDER.filter(k => langs.includes(k)).map(k => item[k] ?? '')]
                    .filter(Boolean)
                    .join('\n\n') + `\n\n(${t.library.surah} ${surah.nameEn} ${surah.number}:${item.number})`
                }
              />
              </View>
            </View>
          )}
        />
      )}
      {audio.element}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1, gap: 4},
  header: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth},
  back: {minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 20, fontWeight: '700', lineHeight: 30},
  card: {flexDirection: 'row', gap: 14, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', marginBottom: 10},
  num: {fontSize: 18, fontWeight: '700', minWidth: 32, textAlign: 'center'},
  name: {fontSize: 17, fontWeight: '600', lineHeight: 26},
  arabicName: {fontSize: 22},
  ayah: {flexDirection: 'column', alignItems: 'stretch', gap: 8},
  ano: {fontSize: 13, fontWeight: '700'},
  arabic: {fontSize: 28, lineHeight: 52, textAlign: 'right'},
  tr: {fontSize: 17, lineHeight: 28},
  rtl: {textAlign: 'right', writingDirection: 'rtl', lineHeight: 34},
  reciterBar: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth},
  playAll: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  reciters: {gap: 8, paddingRight: 16},
  reciter: {borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6},
  playingCard: {borderWidth: 1.5},
  actions: {flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap'},
  playBtn: {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4},
  spinner: {marginTop: 32},
  empty: {textAlign: 'center', marginTop: 32, paddingHorizontal: 24},
});
