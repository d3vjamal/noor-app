import React, {useEffect, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import FeedArt, {FeedKind} from './FeedArt';
import Icon from './Icon';
import {loadAyahs, useSurahs} from '../content/quran';
import {Surah} from '../content/quran';
import {surahNameBn} from '../content/surahBn';
import {HadithBook, HadithRow, loadSection, useHadithBooks} from '../content/hadithIndex';
import {Dua, useDuas} from '../content/duas';
import {Name, useNames} from '../content/names';
import {shareText} from '../share';
import {useSettings} from '../state/settings';
import {FIVE, FivePrayer, PrayerLog, dayKey, loadPrayerLog, prayedCount, prayerStreak, savePrayerLog} from '../tools/prayerLog';
import {useIsFocused} from '@react-navigation/native';

type CardData = {kind: FeedKind; label: string; arabic?: string; text: string; source: string};

const dayNumber = (d = new Date()) =>
  Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);

function Skeleton() {
  const {theme} = useSettings();
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1, duration: 800, useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0.4, duration: 800, useNativeDriver: true}),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [pulse]);
  return (
    <Animated.View style={[styles.card, {opacity: pulse, backgroundColor: theme.surface, borderColor: theme.border}]}>
      <View style={{height: 120, backgroundColor: theme.border}} />
      <View style={styles.body}>
        <View style={[styles.line, {backgroundColor: theme.border, width: '90%'}]} />
        <View style={[styles.line, {backgroundColor: theme.border, width: '70%'}]} />
      </View>
    </Animated.View>
  );
}

function FeedCard({card}: {card: CardData | null}) {
  const {t, theme} = useSettings();
  if (!card) {
    return <Skeleton />;
  }
  return (
    <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
      <View>
        <FeedArt kind={card.kind} />
        <Text style={styles.label}>{card.label}</Text>
      </View>
      <View style={styles.body}>
        {!!card.arabic && (
          <Text style={[styles.arabic, {color: theme.text}]} numberOfLines={5}>
            {card.arabic}
          </Text>
        )}
        <Text style={[styles.text, {color: theme.text}]} numberOfLines={6}>
          {card.text}
        </Text>
        <View style={styles.foot}>
          <Text style={[styles.source, {color: theme.textMuted}]} numberOfLines={1}>
            {card.source}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.home.share}
            hitSlop={10}
            onPress={() => shareText([card.arabic, card.text, `— ${card.source}`].filter(Boolean).join('\n\n'))}>
            <Icon name="share" color={theme.primary} size={22} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type Data = {surahs: Surah[] | null; books: HadithBook[] | null; duas: Dua[] | null; names: Name[] | null};

// One day's four cards. Ayah and hadith load asynchronously, so they show a skeleton first.
function FeedDay({day, data}: {day: number; data: Data}) {
  const {t, settings} = useSettings();
  const bn = settings.language === 'bn';
  const {surahs, books, duas, names} = data;
  const [ayah, setAyah] = useState<CardData | null>(null);
  const [hadith, setHadith] = useState<CardData | null>(null);

  useEffect(() => {
    if (!surahs || !surahs.length) {
      return;
    }
    let alive = true;
    (async () => {
      const total = surahs.reduce((n, x) => n + x.ayahCount, 0);
      let pos = (day * 7919) % total;
      const s = surahs.find(x => {
        if (pos < x.ayahCount) {
          return true;
        }
        pos -= x.ayahCount;
        return false;
      });
      if (!s) {
        return;
      }
      const list = await loadAyahs(s.number);
      const a = list[pos] ?? list[0];
      if (alive && a) {
        setAyah({
          kind: 'ayah',
          label: t.home.ayahOfDay,
          arabic: a.ar,
          text: (bn ? a.bn || a.en : a.en || a.bn) ?? '',
          source: `${bn ? surahNameBn(s.number) ?? s.nameEn : s.nameEn} ${s.number}:${a.number}`,
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, [surahs, day, bn, t]);

  useEffect(() => {
    if (!books || !books.length) {
      return;
    }
    let alive = true;
    (async () => {
      const book = books[day % books.length];
      if (!book.sections.length) {
        return;
      }
      const section = book.sections[day % book.sections.length];
      const rows: HadithRow[] = await loadSection(book.id, section.id);
      const pick = (r: HadithRow) => (bn ? r[1] || r[2] : r[2] || r[1]);
      const usable = rows.filter(r => pick(r) && pick(r).length < 600);
      const row = usable.length ? usable[day % usable.length] : null;
      if (alive && row) {
        setHadith({
          kind: 'hadith',
          label: t.home.hadithOfDay,
          text: pick(row),
          source: `${bn ? book.title.bn : book.title.en} · ${t.library.hadithNo} ${row[0]}`,
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, [books, day, bn, t]);

  const dua: CardData | null =
    duas && duas.length
      ? (() => {
          const d = duas[day % duas.length];
          return {
            kind: 'dua',
            label: t.home.duaOfDay,
            arabic: d.arabic,
            text: bn ? d.meaning.bn : d.meaning.en,
            source: bn ? d.title.bn : d.title.en,
          };
        })()
      : null;
  const name: CardData | null =
    names && names.length
      ? (() => {
          const n = names[day % names.length];
          return {
            kind: 'name',
            label: t.home.nameOfDay,
            arabic: n.arabic,
            text: bn ? n.meaningBn || n.meaningEn : n.meaningEn,
            source: `${n.translit} · ${n.number}/99`,
          };
        })()
      : null;

  return (
    <>
      <FeedCard card={ayah} />
      <FeedCard card={hadith} />
      <FeedCard card={dua} />
      <FeedCard card={name} />
    </>
  );
}

// Today's five prayers as tick chips, kept in step with the Prayer tracker tool.
function PrayerCard() {
  const {t, theme} = useSettings();
  const focused = useIsFocused();
  const [log, setLog] = useState<PrayerLog>({});
  const today = dayKey(new Date());
  useEffect(() => {
    if (focused) {
      loadPrayerLog().then(setLog);
    }
  }, [focused]);
  const toggle = (p: FivePrayer) => {
    const next = {...log, [today]: {...log[today], [p]: !log[today]?.[p]}};
    setLog(next);
    savePrayerLog(next);
  };
  const n = prayedCount(log, today);
  const streak = prayerStreak(log);
  return (
    <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
      <View>
        <FeedArt kind="date" />
        <Text style={styles.label}>{t.tools.prayerLog}</Text>
        <Text style={styles.badge}>
          {n}/5 · {t.tools.streak} {streak}
        </Text>
      </View>
      <View style={[styles.body, styles.chips]}>
        {FIVE.map(p => {
          const on = !!log[today]?.[p];
          return (
            <Pressable
              key={p}
              accessibilityRole="checkbox"
              accessibilityState={{checked: on}}
              onPress={() => toggle(p)}
              style={[styles.chip, {borderColor: theme.primary, backgroundColor: on ? theme.primary : 'transparent'}]}>
              <Icon name="check" color={on ? theme.onPrimary : theme.border} size={18} strokeWidth={2.4} />
              <Text style={{color: on ? theme.onPrimary : theme.text, fontSize: 12, fontWeight: '600'}}>{t.salat[p]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Home feed: today's cards, and a button that keeps adding earlier days like scrolling a feed.
export default function DailyFeed() {
  const {t, theme, settings} = useSettings();
  const locale = settings.language === 'bn' ? 'bn-BD' : 'en-US';
  const today = dayNumber();
  const [days, setDays] = useState(1);
  const data: Data = {
    surahs: useSurahs().data,
    books: useHadithBooks().data,
    duas: useDuas().data,
    names: useNames().data,
  };

  return (
    <View>
      <PrayerCard />
      {Array.from({length: days}, (_, i) => (
        <View key={i}>
          {i > 0 && (
            <Text style={[styles.dayHead, {color: theme.textMuted}]}>
              {new Date(Date.now() - i * 86400000).toLocaleDateString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          )}
          <FeedDay day={today - i} data={data} />
        </View>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() => setDays(d => d + 1)}
        style={[styles.more, {borderColor: theme.primary}]}>
        <Text style={{color: theme.primary, fontWeight: '700'}}>{t.home.loadMore}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {borderWidth: 1, borderRadius: 18, overflow: 'hidden', marginBottom: 14},
  label: {position: 'absolute', left: 16, bottom: 12, color: '#FFFFFF', fontSize: 16, fontWeight: '800'},
  body: {padding: 16, gap: 8},
  badge: {position: 'absolute', right: 14, bottom: 12, color: '#FFFFFF', fontSize: 13, fontWeight: '700'},
  chips: {flexDirection: 'row', justifyContent: 'space-between', gap: 6},
  chip: {flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 8, alignItems: 'center', gap: 2},
  arabic: {fontSize: 24, lineHeight: 42, textAlign: 'right'},
  text: {fontSize: 15, lineHeight: 24},
  foot: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4},
  source: {flex: 1, fontSize: 12},
  line: {height: 12, borderRadius: 6},
  dayHead: {fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 4},
  more: {borderWidth: 1.5, borderRadius: 24, paddingVertical: 12, alignItems: 'center', marginBottom: 16},
});
