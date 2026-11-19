import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, BackHandler, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {useAudioQueue} from '../audio/useAudioQueue';
import {CATEGORIES, Category, Episode, Show, loadEpisodes, searchShows} from '../content/podcasts';
import {useSettings} from '../state/settings';
import {Radio, useRadio} from '../theme/radio';
import Icon from './Icon';

// Audio only: pick a topic, then a podcast, then an episode, which streams in the app.
export default function PodcastsTab() {
  const radio = useRadio();
  const s = useMemo(() => makeStyles(radio), [radio]);
  const {t, settings} = useSettings();
  const lang = settings.language;
  const audio = useAudioQueue();
  const [cat, setCat] = useState<Category>(CATEGORIES[0]);
  const [shows, setShows] = useState<Show[] | null>(null);
  const [show, setShow] = useState<Show | null>(null);
  const [eps, setEps] = useState<Episode[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setShows(null);
    setFailed(false);
    searchShows(cat.term)
      .then(r => alive && setShows(r))
      .catch(() => alive && (setFailed(true), setShows([])));
    return () => {
      alive = false;
    };
  }, [cat]);

  useEffect(() => {
    setEps(null);
    if (!show) {
      return;
    }
    let alive = true;
    setFailed(false);
    loadEpisodes(show.feedUrl)
      .then(r => alive && setEps(r))
      .catch(() => alive && (setFailed(true), setEps([])));
    return () => {
      alive = false;
    };
  }, [show]);

  // Back from a show's episodes returns to the list of shows.
  useEffect(() => {
    if (!show) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShow(null);
      return true;
    });
    return () => sub.remove();
  }, [show]);

  const playing = audio.key;
  const nowEp = eps?.find(e => e.url === playing);

  if (show) {
    return (
      <View>
        {audio.element}
        <Pressable accessibilityRole="button" onPress={() => setShow(null)} style={{paddingBottom: 10}}>
          <Text style={{color: radio.amber, fontSize: 16}} numberOfLines={1}>
            ← {show.name}
          </Text>
        </Pressable>
        {nowEp && (
          <View style={[s.card, s.row, {backgroundColor: radio.amber}]}>
            <View style={{flex: 1}}>
              <Text style={{color: radio.onAccent, fontWeight: '700'}} numberOfLines={2}>
                {nowEp.title}
              </Text>
              <Text style={{color: radio.onAccent, opacity: 0.85, fontSize: 13}}>
                {audio.failed ? t.common.needInternet : audio.loading ? '…' : show.name}
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t.listen.pause} onPress={audio.stop} hitSlop={10}>
              <Icon name="stop" color={radio.onAccent} size={28} />
            </Pressable>
          </View>
        )}
        {eps === null && <ActivityIndicator color={radio.amber} style={{marginTop: 24}} />}
        {eps !== null && !eps.length && <Text style={s.empty}>{t.common.needInternet}</Text>}
        {(eps ?? []).map(e => (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            onPress={() => (playing === e.url ? audio.stop() : audio.play(e.url, [e.url]))}
            style={[s.card, s.row]}>
            <View style={{flex: 1}}>
              <Text style={s.title} numberOfLines={3}>
                {e.title}
              </Text>
              {!!e.date && <Text style={s.muted}>{e.date}</Text>}
            </View>
            <Icon name={playing === e.url ? 'stop' : 'play'} color={radio.amber} size={22} />
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View>
      <Text style={s.note}>{t.listen.lecturesNote}</Text>
      <View style={s.chips}>
        {CATEGORIES.map(c => {
          const on = c.id === cat.id;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              onPress={() => setCat(c)}
              style={[s.chip, {backgroundColor: on ? radio.amber : radio.glass, borderColor: on ? radio.amber : radio.glassBorder}]}>
              <Text style={{color: on ? radio.onAccent : radio.text, fontWeight: '600'}}>{c.label[lang]}</Text>
            </Pressable>
          );
        })}
      </View>
      {shows === null && <ActivityIndicator color={radio.amber} style={{marginTop: 24}} />}
      {shows !== null && (!shows.length || failed) && <Text style={s.empty}>{t.common.needInternet}</Text>}
      {(shows ?? []).map(sh => (
        <Pressable key={sh.id} accessibilityRole="button" onPress={() => setShow(sh)} style={[s.card, s.row]}>
          {sh.art ? <Image source={{uri: sh.art}} style={s.art} /> : <View style={s.art} />}
          <View style={{flex: 1}}>
            <Text style={s.title} numberOfLines={2}>
              {sh.name}
            </Text>
            <Text style={s.muted} numberOfLines={1}>
              {sh.artist}
            </Text>
          </View>
          <Text style={{color: radio.amber, fontSize: 22}}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (radio: Radio) =>
  StyleSheet.create({
    note: {color: radio.muted, fontSize: 14, lineHeight: 22, marginBottom: 12},
    chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14},
    chip: {borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8},
    card: {padding: 12, borderRadius: 16, borderWidth: 1, borderColor: radio.glassBorder, backgroundColor: radio.glass, marginBottom: 10},
    row: {flexDirection: 'row', alignItems: 'center', gap: 12},
    art: {width: 54, height: 54, borderRadius: 10, backgroundColor: radio.disc},
    title: {color: radio.text, fontSize: 16, fontWeight: '600', lineHeight: 23},
    muted: {color: radio.muted, fontSize: 13},
    empty: {color: radio.muted, textAlign: 'center', marginTop: 28, fontSize: 15},
  });
