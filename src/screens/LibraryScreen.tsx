import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HadithReader from '../components/HadithReader';
import Icon, {IconName} from '../components/Icon';
import PdfReader from '../components/PdfReader';
import Screen from '../components/Screen';
import QuranReader from '../components/QuranReader';
import {HadithBook, useHadithBooks} from '../content/hadithIndex';
import {Book, useBooks} from '../content/books';
import {useSurahs} from '../content/quran';
import {surahMeaningBn, surahNameBn} from '../content/surahBn';
import {useSettings} from '../state/settings';

type Tab = 'quran' | 'hadith' | 'books';
type Last = {kind: 'quran'; surah: number} | {kind: 'hadith'; id: string} | {kind: 'book'; id: string};

const LAST_KEY = 'library.last.v1';
const TAB_ICON: Record<Tab, IconName> = {quran: 'quran', hadith: 'crescent', books: 'library'};

// Reading only: the Quran, the hadith collections and the Muntakhab Ahadis book.
// Playlists live in the Listen tab.
type Props = {embedded?: boolean; onImmersive?: (on: boolean) => void};

export default function LibraryScreen({embedded = false, onImmersive}: Props) {
  const {t, theme, settings} = useSettings();
  const bn = settings.language === 'bn';
  const {items: books, refresh, refreshing} = useBooks();
  const hadith = useHadithBooks();
  const surahs = useSurahs();
  const [tab, setTab] = useState<Tab>('quran');
  const [query, setQuery] = useState('');
  const [book, setBook] = useState<Book | null>(null);
  const [hadithBook, setHadithBook] = useState<HadithBook | null>(null);
  const [quranOpen, setQuranOpen] = useState(false);
  const [quranSurah, setQuranSurah] = useState<number | undefined>();
  const [last, setLast] = useState<Last | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LAST_KEY)
      .then(raw => raw && setLast(JSON.parse(raw)))
      .catch(() => {});
  }, []);
  const remember = (l: Last) => {
    setLast(l);
    AsyncStorage.setItem(LAST_KEY, JSON.stringify(l)).catch(() => {});
  };

  const openQuran = (surah?: number) => {
    setQuranSurah(surah);
    setQuranOpen(true);
    if (surah) {
      remember({kind: 'quran', surah});
    }
  };
  const openHadith = (b: HadithBook) => {
    setHadithBook(b);
    remember({kind: 'hadith', id: b.id});
  };
  const openBook = (b: Book) => {
    setBook(b);
    remember({kind: 'book', id: b.id});
  };

  // A full-screen reader is open: the hub hides its own switch.
  const immersive = !!book || !!hadithBook || quranOpen;
  useEffect(() => {
    onImmersive?.(immersive);
  }, [immersive, onImmersive]);

  const q = query.trim().toLowerCase();
  const surahRows = useMemo(
    () =>
      (surahs.data ?? []).filter(x => {
        if (!q) {
          return true;
        }
        return (
          String(x.number) === q ||
          x.nameEn.toLowerCase().includes(q) ||
          x.meaningEn.toLowerCase().includes(q) ||
          (surahNameBn(x.number) ?? '').includes(q) ||
          (surahMeaningBn(x.number) ?? '').includes(q)
        );
      }),
    [surahs.data, q],
  );
  const hadithRows = (hadith.data ?? []).filter(
    b => !q || b.title.en.toLowerCase().includes(q) || b.title.bn.includes(q),
  );
  const bookRows = books.filter(
    b => !q || b.title.en.toLowerCase().includes(q) || b.title.bn.includes(q),
  );

  if (book) {
    return <PdfReader book={book} onBack={() => setBook(null)} />;
  }
  if (quranOpen) {
    return <QuranReader initialSurah={quranSurah} onBack={() => setQuranOpen(false)} />;
  }
  if (hadithBook) {
    return <HadithReader book={hadithBook} onBack={() => setHadithBook(null)} />;
  }

  const tabs: {key: Tab; label: string; count: string}[] = [
    {key: 'quran', label: t.library.tabQuran, count: '114'},
    {key: 'hadith', label: t.library.tabHadith, count: String(hadith.data?.length ?? '')},
    {key: 'books', label: t.library.tabBooks, count: String(books.length)},
  ];

  // Resolve the saved "last read" item to something we can open and name.
  let resume: {title: string; sub: string; onPress: () => void} | null = null;
  if (last?.kind === 'quran') {
    const x = surahs.data?.find(y => y.number === last.surah);
    if (x) {
      resume = {
        title: `${last.surah}. ${bn ? surahNameBn(x.number) ?? x.nameEn : x.nameEn}`,
        sub: t.library.tabQuran,
        onPress: () => openQuran(last.surah),
      };
    }
  } else if (last?.kind === 'hadith') {
    const x = hadith.data?.find(y => y.id === last.id);
    if (x) {
      resume = {title: x.title[settings.language], sub: t.library.tabHadith, onPress: () => openHadith(x)};
    }
  } else if (last?.kind === 'book') {
    const x = books.find(y => y.id === last.id);
    if (x) {
      resume = {title: x.title[settings.language], sub: t.library.tabBooks, onPress: () => openBook(x)};
    }
  }

  return (
    <Screen
      embedded={embedded}
      title={t.library.title}
      onRefresh={() => {
        refresh();
        hadith.refresh();
        surahs.refresh();
      }}
      refreshing={refreshing || hadith.refreshing}>
      {resume && (
        <Pressable
          accessibilityRole="button"
          onPress={resume.onPress}
          style={[styles.resume, {backgroundColor: theme.primary}]}>
          <View style={styles.flex}>
            <Text style={{color: theme.onPrimary, opacity: 0.85, fontSize: 13}}>{t.library.continueReading}</Text>
            <Text style={{color: theme.onPrimary, fontSize: 18, fontWeight: '700'}} numberOfLines={1}>
              {resume.title}
            </Text>
            <Text style={{color: theme.onPrimary, opacity: 0.85, fontSize: 13}}>{resume.sub}</Text>
          </View>
          <Icon name="play" color={theme.onPrimary} size={26} />
        </Pressable>
      )}

      <View style={styles.tabs}>
        {tabs.map(x => {
          const on = tab === x.key;
          return (
            <Pressable
              key={x.key}
              accessibilityRole="tab"
              accessibilityState={{selected: on}}
              onPress={() => {
                setTab(x.key);
                setQuery('');
              }}
              style={[
                styles.tab,
                {borderColor: on ? theme.primary : theme.border, backgroundColor: on ? theme.primary : theme.surface},
              ]}>
              <Icon name={TAB_ICON[x.key]} color={on ? theme.onPrimary : theme.primary} size={26} />
              <Text style={{color: on ? theme.onPrimary : theme.text, fontWeight: '700', fontSize: 15}}>{x.label}</Text>
              <Text style={{color: on ? theme.onPrimary : theme.textMuted, fontSize: 12}}>{x.count}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.library.search}
        placeholderTextColor={theme.textMuted}
        clearButtonMode="while-editing"
        style={[styles.search, {color: theme.text, borderColor: theme.border, backgroundColor: theme.surface}]}
      />

      {tab === 'quran' &&
        surahRows.map(x => (
          <Pressable
            key={x.number}
            accessibilityRole="button"
            onPress={() => openQuran(x.number)}
            style={[styles.row, {backgroundColor: theme.surface, borderColor: theme.border}]}>
            <View style={[styles.num, {borderColor: theme.primary}]}>
              <Text style={{color: theme.primary, fontWeight: '700'}}>{x.number}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={[styles.name, {color: theme.text}]}>
                {bn ? surahNameBn(x.number) ?? x.nameEn : x.nameEn}
              </Text>
              <Text style={{color: theme.textMuted, fontSize: 13}} numberOfLines={1}>
                {bn ? surahMeaningBn(x.number) ?? x.meaningEn : x.meaningEn} ·{' '}
                {x.revelation === 'Mecca' ? t.library.meccan : t.library.medinan} ·{' '}
                {t.library.quranSubtitle.replace('%d', String(x.ayahCount))}
              </Text>
            </View>
            <Text style={[styles.arabic, {color: theme.text}]}>{x.nameAr}</Text>
          </Pressable>
        ))}

      {tab === 'hadith' &&
        hadithRows.map(b => (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            accessibilityLabel={b.title[settings.language]}
            onPress={() => openHadith(b)}
            style={[styles.row, {backgroundColor: theme.surface, borderColor: theme.border}]}>
            <View style={[styles.badge, {backgroundColor: theme.primary}]}>
              <Icon name="crescent" color={theme.onPrimary} size={22} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.name, {color: theme.text}]}>{b.title[settings.language]}</Text>
              <Text style={{color: theme.textMuted, fontSize: 13}}>
                {t.library.hadithSubtitle.replace('%d', String(b.sections.length))}
              </Text>
            </View>
            <Text style={{color: theme.primary, fontSize: 20}}>›</Text>
          </Pressable>
        ))}

      {tab === 'books' &&
        bookRows.map(b => (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            accessibilityLabel={b.title[settings.language]}
            onPress={() => openBook(b)}
            style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
            <View style={[styles.cover, {backgroundColor: theme.primary}]}>
              <Text style={[styles.coverText, {color: theme.onPrimary}]}>{b.title[settings.language]}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={[styles.name, {color: theme.text}]}>{b.title[settings.language]}</Text>
              <Text style={{color: theme.textMuted, fontSize: 14}}>{t.library.bookSubtitle}</Text>
              <Text style={{color: theme.primary, fontSize: 16}}>{t.reader.open} ▶</Text>
            </View>
          </Pressable>
        ))}

      {((tab === 'quran' && !surahRows.length) ||
        (tab === 'hadith' && !hadithRows.length) ||
        (tab === 'books' && !bookRows.length)) && (
        <Text style={[styles.empty, {color: theme.textMuted}]}>
          {q ? t.library.noMatch : t.library.emptyList}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, gap: 6},
  resume: {flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16, marginBottom: 14},
  tabs: {flexDirection: 'row', gap: 8, marginBottom: 12},
  search: {borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, marginBottom: 12},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8},
  num: {width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center'},
  badge: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  arabic: {fontSize: 20},
  tab: {flex: 1, minHeight: 84, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2},
  card: {
    flexDirection: 'row',
    gap: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    marginBottom: 12,
  },
  cover: {
    width: 96,
    height: 128,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
  },
  name: {fontSize: 18, fontWeight: '700', lineHeight: 28},
  thumb: {width: 52, height: 52, borderRadius: 26},
  empty: {fontSize: 16, lineHeight: 28, textAlign: 'center', marginTop: 32},
});
