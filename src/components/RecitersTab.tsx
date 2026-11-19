import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAudioQueue } from '../audio/useAudioQueue';
import { RECITERS, Reciter, Surah, ayahAudioUrl, globalAyah, useSurahs } from '../content/quran';
import { surahNameBn } from '../content/surahBn';
import { useSettings } from '../state/settings';
import { Radio, useRadio } from '../theme/radio';
import Icon from './Icon';

// Popular reciters stream a whole surah, ayah by ayah, from the free Al Quran Cloud audio CDN.
export default function RecitersTab() {
  const radio = useRadio();
  const s = useMemo(() => makeStyles(radio), [radio]);
  const { t, settings } = useSettings();
  const bn = settings.language === 'bn';
  const lang = settings.language;
  const surahs = useSurahs().data;
  const audio = useAudioQueue();
  const [reciter, setReciter] = useState<Reciter | null>(null);
  const [query, setQuery] = useState('');

  const sName = (x: Surah) => (bn ? surahNameBn(x.number) ?? x.nameEn : x.nameEn);
  const q = query.trim().toLowerCase();
  const rows = (surahs ?? []).filter(
    x => !q || String(x.number) === q || x.nameEn.toLowerCase().includes(q) || (surahNameBn(x.number) ?? '').includes(q),
  );

  const playSurah = (x: Surah) => {
    if (!reciter || !surahs) {
      return;
    }
    const base = globalAyah(surahs, x.number, 1);
    const urls = Array.from({ length: x.ayahCount }, (_, i) => ayahAudioUrl(reciter, base + i));
    audio.play(`${reciter.id}:${x.number}`, urls);
  };

  if (!reciter) {
    return (
      <View>
        {RECITERS.map(r => (
          <Pressable key={r.id} accessibilityRole="button" onPress={() => setReciter(r)} style={[s.card, s.row]}>
            <View style={s.avatar}>
              <Text style={{ color: radio.onAccent, fontWeight: '700', fontSize: 18 }}>{r.name.en[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{r.name[lang]}</Text>
              <Text style={s.muted}>{t.listen.fullQuran}</Text>
            </View>
            <Text style={{ color: radio.amber, fontSize: 22 }}>›</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  const nowPlaying = audio.key?.startsWith(`${reciter.id}:`) ? Number(audio.key.split(':')[1]) : null;
  const nowSurah = surahs?.find(x => x.number === nowPlaying);
  return (
    <View>
      {audio.element}
      <Pressable accessibilityRole="button" onPress={() => setReciter(null)} style={{ paddingBottom: 10 }}>
        <Text style={{ color: radio.amber, fontSize: 16 }}>← {reciter.name[lang]}</Text>
      </Pressable>
      {nowSurah && (
        <View style={[s.card, s.row, { backgroundColor: radio.amber }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: radio.onAccent, fontWeight: '700', fontSize: 17 }}>
              {nowSurah.number}. {sName(nowSurah)}
            </Text>
            <Text style={{ color: radio.onAccent, opacity: 0.85, fontSize: 13 }}>
              {audio.failed ? t.common.needInternet : `${audio.index + 1} / ${nowSurah.ayahCount}`}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t.listen.pause} onPress={audio.stop} hitSlop={10}>
            <Icon name="stop" color={radio.onAccent} size={28} />
          </Pressable>
        </View>
      )}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.library.search}
        placeholderTextColor={radio.muted}
        style={s.search}
      />
      {rows.map(x => (
        <Pressable key={x.number} accessibilityRole="button" onPress={() => playSurah(x)} style={[s.card, s.row]}>
          <View style={[s.num, { borderColor: radio.amber }]}>
            <Text style={{ color: radio.amber, fontWeight: '700' }}>{x.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{sName(x)}</Text>
            <Text style={s.muted}>{t.library.quranSubtitle.replace('%d', String(x.ayahCount))}</Text>
          </View>
          <Icon name={nowPlaying === x.number ? 'stop' : 'play'} color={radio.amber} size={22} />
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (radio: Radio) =>
  StyleSheet.create({
    note: { color: radio.muted, fontSize: 14, lineHeight: 22, marginBottom: 12 },
    card: { padding: 12, borderRadius: 16, borderWidth: 1, borderColor: radio.glassBorder, backgroundColor: radio.glass, marginBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: radio.amber, alignItems: 'center', justifyContent: 'center' },
    num: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    title: { color: radio.text, fontSize: 16, fontWeight: '600', lineHeight: 24 },
    muted: { color: radio.muted, fontSize: 13 },
    search: { borderWidth: 1, borderColor: radio.glassBorder, backgroundColor: radio.glass, color: radio.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, marginBottom: 12 },
  });
