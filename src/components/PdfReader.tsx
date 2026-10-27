import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Pdf from 'react-native-pdf';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Book} from '../content/books';
import {useBookFiles} from '../content/bookFiles';
import {useSettings} from '../state/settings';
import * as speech from '../tts/speech';

type Props = {
  uri: string;
  storageKey: string;
  pages: string[];
  onBack: () => void;
};

// One PDF page per screen, swipe horizontally; last page is remembered between launches.
// "Listen" reads each page's OCR text aloud and turns to the next page when it finishes.
function Reader({uri, storageKey, pages, onBack}: Props) {
  const {theme, t, settings} = useSettings();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [jump, setJump] = useState('');
  const [startPage, setStartPage] = useState<number | null>(null);
  // Jumps drive the viewer's `page` prop (its setPage() command is a no-op with the new
  // architecture). Remounting via `n` makes a jump apply even to the page already shown.
  const [nav, setNav] = useState<{page: number; n: number} | null>(null);
  const go = useCallback(
    (p: number) => {
      if (p >= 1 && p <= total) {
        setNav(prev => ({page: p, n: (prev?.n ?? 0) + 1}));
      }
    },
    [total],
  );
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then(v => setStartPage(v ? parseInt(v, 10) || 1 : 1))
      .catch(() => setStartPage(1));
  }, [storageKey]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  useEffect(() => () => speech.stop(), []);

  useEffect(() => {
    if (!listening) {
      return;
    }
    const advance = () => (page < total ? go(page + 1) : setListening(false));
    const text = (pages[page - 1] || '').trim();
    if (!text) {
      setNotice(t.reader.noText);
      const id = setTimeout(advance, 1200);
      return () => clearTimeout(id);
    }
    setNotice('');
    speech.speak(text, settings.speechSpeed, {
      onDone: advance,
      onError: () => {
        setListening(false);
        setNotice(t.reader.ttsUnavailable);
      },
    });
    return () => speech.stop();
  }, [listening, page, total, pages, settings.speechSpeed, t, go]);

  const source = {uri, cache: true};

  return (
    <View
      style={[
        styles.root,
        {backgroundColor: theme.background, paddingTop: insets.top},
      ]}>
      <View style={[styles.bar, {borderBottomColor: theme.border}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.listen.back}
          onPress={onBack}
          style={styles.back}>
          <Text style={{color: theme.primary, fontSize: 24}}>←</Text>
        </Pressable>
        <View style={styles.spacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={listening ? t.reader.stop : t.reader.listen}
          onPress={() => setListening(v => !v)}
          style={[
            styles.listen,
            {
              backgroundColor: listening ? theme.surface : theme.primary,
              borderColor: theme.primary,
            },
          ]}>
          <Text
            style={{
              color: listening ? theme.text : '#000',
              fontSize: 16,
              fontWeight: '700',
            }}>
            {listening ? '❚❚  ' + t.reader.stop : '🔊  ' + t.reader.listen}
          </Text>
        </Pressable>
      </View>

      {!!notice && (
        <Text style={{color: theme.textMuted, textAlign: 'center', padding: 6}}>
          {notice}
        </Text>
      )}

      {startPage !== null && (
        <Pdf
          key={nav?.n ?? 0}
          source={source}
          page={nav?.page ?? startPage}
          horizontal
          enablePaging
          spacing={0}
          style={[styles.pdf, {backgroundColor: theme.surface}]}
          onLoadComplete={n => setTotal(n)}
          // onLoadComplete never reaches JS with the new architecture, but pageChanged does and
          // also carries the page count, so take the total from both.
          onPageChanged={(p, count) => {
            setPage(p);
            if (count > 0) {
              setTotal(count);
            }
            AsyncStorage.setItem(storageKey, String(p)).catch(() => {});
          }}
          onError={e => console.warn('PDF error', e)}
        />
      )}

      <View
        style={[
          styles.controls,
          {borderTopColor: theme.border, paddingBottom: insets.bottom + 8},
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.reader.prev}
          disabled={page <= 1}
          onPress={() => go(page - 1)}
          style={[styles.nav, page <= 1 && {opacity: 0.4}]}>
          <Text style={{color: theme.primary, fontSize: 26}}>◀</Text>
        </Pressable>
        <View style={styles.center}>
          <Text style={{color: theme.text, fontSize: 15}}>
            {page} / {total || '–'}
          </Text>
          <View style={styles.jumpRow}>
            <TextInput
              value={jump}
              onChangeText={setJump}
              keyboardType="number-pad"
              placeholder={t.reader.goToPage}
              placeholderTextColor={theme.textMuted}
              accessibilityLabel={t.reader.goToPage}
              style={[
                styles.input,
                {color: theme.text, borderColor: theme.border},
              ]}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                go(parseInt(jump, 10));
                setJump('');
                Keyboard.dismiss();
              }}
              style={[styles.goBtn, {backgroundColor: theme.primary}]}>
              <Text style={{color: theme.onPrimary, fontSize: 15}}>
                {t.reader.go}
              </Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.reader.next}
          disabled={page >= total}
          onPress={() => go(page + 1)}
          style={[styles.nav, page >= total && {opacity: 0.4}]}>
          <Text style={{color: theme.primary, fontSize: 26}}>▶</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingRight: 16,
  },
  back: {width: 56, height: 56, alignItems: 'center', justifyContent: 'center'},
  spacer: {flex: 1},
  loading: {alignItems: 'flex-start'},
  loadingBody: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  listen: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    justifyContent: 'center',
    borderWidth: 1,
  },
  pdf: {flex: 1, width: '100%'},
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  nav: {width: 64, height: 56, alignItems: 'center', justifyContent: 'center'},
  center: {flex: 1, alignItems: 'center', gap: 6},
  jumpRow: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  input: {
    width: 110,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  goBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
});

// Resolves the book's files first (bundled, or downloaded once from Convex storage), then shows the reader.
export default function PdfReader({
  book,
  onBack,
}: {
  book: Book;
  onBack: () => void;
}) {
  const {theme, t} = useSettings();
  const insets = useSafeAreaInsets();
  const files = useBookFiles(book);

  useEffect(() => {
    if (files.status === 'ready') {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [files.status, onBack]);

  if (files.status === 'ready') {
    return (
      <Reader
        uri={files.uri}
        storageKey={`pdf.page.${book.id}`}
        pages={files.pages}
        onBack={onBack}
      />
    );
  }
  return (
    <View
      style={[
        styles.root,
        styles.loading,
        {backgroundColor: theme.background, paddingTop: insets.top},
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.listen.back}
        onPress={onBack}
        style={styles.back}>
        <Text style={{color: theme.primary, fontSize: 24}}>←</Text>
      </Pressable>
      <View style={styles.loadingBody}>
        {files.status === 'loading' ? (
          <>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{color: theme.textMuted, fontSize: 16}}>
              {t.reader.downloading}
              {files.progress > 0
                ? ` ${Math.round(files.progress * 100)}%`
                : ''}
            </Text>
          </>
        ) : (
          <Text
            style={{color: theme.textMuted, fontSize: 16, textAlign: 'center'}}>
            {t.reader.loadFailed}
          </Text>
        )}
      </View>
    </View>
  );
}
