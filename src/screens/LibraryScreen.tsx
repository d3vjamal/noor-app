import React, {useEffect, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import HadithReader from '../components/HadithReader';
import PdfReader from '../components/PdfReader';
import Screen from '../components/Screen';
import QuranReader from '../components/QuranReader';
import {HadithBook, useHadithBooks} from '../content/hadithIndex';
import {Book, useBooks} from '../content/books';
import {useSettings} from '../state/settings';

type Tab = 'books' | 'hadith' | 'quran';

// Reading only: the Muntakhab Ahadis book and the hadith collections. Playlists live in the Listen tab.
type Props = {embedded?: boolean; onImmersive?: (on: boolean) => void};

export default function LibraryScreen({embedded = false, onImmersive}: Props) {
  const {t, theme, settings} = useSettings();
  const {items: books, refresh, refreshing} = useBooks();
  const [tab, setTab] = useState<Tab>('books');
  const [book, setBook] = useState<Book | null>(null);
  const hadith = useHadithBooks();
  const [hadithBook, setHadithBook] = useState<HadithBook | null>(null);
  const [quranOpen, setQuranOpen] = useState(false);

  // A full-screen reader is open: the hub hides its own switch.
  const immersive = !!book || !!hadithBook || quranOpen;
  useEffect(() => {
    onImmersive?.(immersive);
  }, [immersive, onImmersive]);

  if (book) {
    return <PdfReader book={book} onBack={() => setBook(null)} />;
  }
  if (quranOpen) {
    return <QuranReader onBack={() => setQuranOpen(false)} />;
  }
  if (hadithBook) {
    return (
      <HadithReader book={hadithBook} onBack={() => setHadithBook(null)} />
    );
  }
  const tabs: {key: Tab; label: string}[] = [
    {key: 'books', label: t.library.tabBooks},
    {key: 'hadith', label: t.library.tabHadith},
    {key: 'quran', label: t.library.tabQuran},
  ];
  return (
    <Screen
      embedded={embedded}
      title={t.library.title}
      onRefresh={() => {
        refresh();
        hadith.refresh();
      }}
      refreshing={refreshing || hadith.refreshing}>
      <View style={styles.tabs}>
        {tabs.map(x => {
          const on = tab === x.key;
          return (
            <Pressable
              key={x.key}
              accessibilityRole="tab"
              accessibilityState={{selected: on}}
              onPress={() => setTab(x.key)}
              style={[
                styles.tab,
                {borderColor: on ? theme.primary : theme.border},
                on && {backgroundColor: theme.primary},
              ]}>
              <Text
                style={{
                  color: on ? theme.onPrimary : theme.text,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                {x.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'books' &&
        books.map(b => (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            accessibilityLabel={b.title[settings.language]}
            onPress={() => setBook(b)}
            style={[
              styles.card,
              {backgroundColor: theme.surface, borderColor: theme.border},
            ]}>
            <View style={[styles.cover, {backgroundColor: theme.primary}]}>
              <Text style={[styles.coverText, {color: theme.onPrimary}]}>
                {b.title[settings.language]}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={[styles.name, {color: theme.text}]}>
                {b.title[settings.language]}
              </Text>
              <Text style={{color: theme.textMuted, fontSize: 14}}>
                {t.library.bookSubtitle}
              </Text>
              <Text style={{color: theme.primary, fontSize: 16}}>
                {t.reader.open} ▶
              </Text>
            </View>
          </Pressable>
        ))}

      {tab === 'quran' && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setQuranOpen(true)}
          style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
          <View style={styles.flex}>
            <Text style={[styles.name, {color: theme.text}]}>{t.library.tabQuran}</Text>
            <Text style={{color: theme.textMuted, fontSize: 14}}>
              {t.library.quranSubtitle.replace('%d', '6236')}
            </Text>
            <Text style={{color: theme.primary, fontSize: 16}}>{t.reader.open} ▶</Text>
          </View>
        </Pressable>
      )}

      {tab === 'hadith' &&
        (hadith.data ?? []).map(b => (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            accessibilityLabel={b.title[settings.language]}
            onPress={() => setHadithBook(b)}
            style={[
              styles.card,
              {backgroundColor: theme.surface, borderColor: theme.border},
            ]}>
            <View style={styles.flex}>
              <Text style={[styles.name, {color: theme.text}]}>
                {b.title[settings.language]}
              </Text>
              <Text style={{color: theme.textMuted, fontSize: 14}}>
                {t.library.hadithSubtitle.replace('%d', String(b.sections.length))}
              </Text>
              <Text style={{color: theme.primary, fontSize: 16}}>
                {t.reader.open} ▶
              </Text>
            </View>
          </Pressable>
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, gap: 6},
  tabs: {flexDirection: 'row', gap: 8, marginBottom: 16},
  tab: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    gap: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    marginBottom: 12,
  },
  row: {gap: 12, minHeight: 72},
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
