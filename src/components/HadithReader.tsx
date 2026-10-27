import React, {useEffect, useState} from 'react';
import {
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {HadithBook, HadithRow, loadSection} from '../content/hadithIndex';
import ShareBar from './ShareBar';
import LangToggle, {LANG_ORDER, TextLang, toggleLang} from './LangToggle';
import {useSettings} from '../state/settings';

// Row layout is [number, bangla, english, urdu]; column index per language.
const COL: Record<TextLang, number> = {bn: 1, en: 2, ur: 3};
const LANG_MISSING: Record<TextLang, string> = {
  bn: 'বাংলা অনুবাদ নেই',
  ur: 'اردو ترجمہ دستیاب نہیں',
  en: 'No English translation',
};

type Props = {book: HadithBook; onBack: () => void};

// Two levels: the book's sections (chapters), then the hadith of one section.
export default function HadithReader({book, onBack}: Props) {
  const {theme, t, settings} = useSettings();
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<string | null>(null);
  const [langs, setLangs] = useState<TextLang[]>([settings.language]);
  const toggle = (k: TextLang) => setLangs(cur => toggleLang(cur, k));

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (section) {
        setSection(null);
      } else {
        onBack();
      }
      return true;
    });
    return () => sub.remove();
  }, [section, onBack]);

  const current = book.sections.find(s => s.id === section);
  const [hadith, setHadith] = useState<HadithRow[]>([]);

  useEffect(() => {
    setHadith([]);
    if (!section) {
      return;
    }
    let alive = true;
    loadSection(book.id, section)
      .then(rows => alive && setHadith(rows))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [book.id, section]);

  return (
    <View
      style={[
        styles.root,
        {backgroundColor: theme.background, paddingTop: insets.top},
      ]}>
      <View style={[styles.header, {borderBottomColor: theme.border}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (section ? setSection(null) : onBack())}
          style={styles.back}>
          <Text style={{color: theme.primary, fontSize: 28}}>←</Text>
        </Pressable>
        <View style={styles.flex}>
          <Text
            numberOfLines={1}
            accessibilityRole="header"
            style={[styles.title, {color: theme.text}]}>
            {book.title[settings.language]}
          </Text>
          {current && (
            <Text numberOfLines={1} style={{color: theme.textMuted}}>
              {current.id}. {current.name}
            </Text>
          )}
        </View>
      </View>

      <LangToggle langs={langs} onToggle={toggle} />

      {!current ? (
        <FlatList
          data={book.sections}
          keyExtractor={s => s.id}
          contentContainerStyle={{padding: 16, paddingBottom: insets.bottom + 16}}
          renderItem={({item}) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSection(item.id)}
              style={[
                styles.card,
                {backgroundColor: theme.surface, borderColor: theme.border},
              ]}>
              <Text style={[styles.num, {color: theme.primary}]}>{item.id}</Text>
              <View style={styles.flex}>
                <Text style={[styles.name, {color: theme.text}]}>
                  {item.name}
                </Text>
                <Text style={{color: theme.textMuted}}>
                  {t.library.hadithNo}: {item.count}
                </Text>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={hadith}
          keyExtractor={h => String(h[0])}
          initialNumToRender={8}
          contentContainerStyle={{padding: 16, paddingBottom: insets.bottom + 16}}
          renderItem={({item}) => (
            <View
              style={[
                styles.card,
                styles.hadith,
                {backgroundColor: theme.surface, borderColor: theme.border},
              ]}>
              <Text style={[styles.hno, {color: theme.primary}]}>
                {t.library.hadithNo} {item[0]}
              </Text>
              {LANG_ORDER
                .filter(k => langs.includes(k))
                .map((k, i) => (
                  <React.Fragment key={k}>
                    {i > 0 && (
                      <View style={[styles.rule, {backgroundColor: theme.border}]} />
                    )}
                    {item[COL[k]] !== '' ? (
                      <Text
                        style={[
                          styles.text,
                          {color: theme.text},
                          k === 'ur' && styles.rtl,
                        ]}
                        selectable>
                        {item[COL[k]]}
                      </Text>
                    ) : (
                      <Text style={{color: theme.textMuted}}>{LANG_MISSING[k]}</Text>
                    )}
                  </React.Fragment>
                ))}
              <ShareBar
                text={() =>
                  `${book.title[settings.language]} — ${t.library.hadithNo} ${item[0]}\n\n` +
                  LANG_ORDER.filter(k => langs.includes(k) && item[COL[k]] !== '')
                    .map(k => item[COL[k]])
                    .join('\n\n')
                }
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  rtl: {textAlign: 'right', writingDirection: 'rtl', lineHeight: 34},
  flex: {flex: 1, gap: 4},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 20, fontWeight: '700', lineHeight: 30},
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    marginBottom: 10,
  },
  num: {fontSize: 18, fontWeight: '700', minWidth: 32, textAlign: 'center'},
  name: {fontSize: 17, fontWeight: '600', lineHeight: 26},
  hadith: {flexDirection: 'column', alignItems: 'stretch', gap: 8},
  rule: {height: StyleSheet.hairlineWidth},
  hno: {fontSize: 14, fontWeight: '700'},
  text: {fontSize: 18, lineHeight: 32},
});
