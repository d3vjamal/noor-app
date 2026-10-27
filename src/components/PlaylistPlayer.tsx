import React from 'react';
import {Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Playlist} from '../content/types';
import {useSettings} from '../state/settings';
import {Radio, useRadio} from '../theme/radio';
import SpotifyPlayer, {spotifyUri} from './SpotifyPlayer';
import YouTubePlayer, {parseYouTube} from './YouTubePlayer';

type Props = {playlist: Playlist; onBack: () => void};

// Full-screen player: back bar + the provider-specific player with custom controls.
export default function PlaylistPlayer({playlist, onBack}: Props) {
  const {settings, t} = useSettings();
  const radio = useRadio();
  const styles = React.useMemo(() => makeStyles(radio), [radio]);
  const insets = useSafeAreaInsets();
  const title =
    settings.language === 'en' && playlist.titleEn
      ? playlist.titleEn
      : playlist.title;
  const yt =
    playlist.provider === 'youtube' ? parseYouTube(playlist.url) : null;
  const sp = playlist.provider === 'spotify' ? spotifyUri(playlist.url) : null;

  return (
    <View
      style={[
        styles.root,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <StatusBar barStyle={radio.statusBar} backgroundColor={radio.bg} />
      <View style={styles.bar}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t.listen.back}
          style={styles.back}>
          <Text style={{color: radio.amber, fontSize: 24}}>←</Text>
        </Pressable>
        <Text numberOfLines={2} style={styles.title}>
          {title}
        </Text>
      </View>
      {yt ? (
        <YouTubePlayer cfg={yt} cover={playlist.thumbnail} />
      ) : sp ? (
        <SpotifyPlayer uri={sp} title={title} cover={playlist.thumbnail} />
      ) : (
        <Text style={{color: radio.muted, padding: 16}}>
          {t.listen.cannotEmbed}
        </Text>
      )}
    </View>
  );
}

const makeStyles = (radio: Radio) =>
  StyleSheet.create({
    root: {flex: 1, backgroundColor: radio.bg},
    bar: {flexDirection: 'row', alignItems: 'center', paddingRight: 16},
    back: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontSize: 17,
      lineHeight: 26,
      fontWeight: '600',
      color: radio.text,
    },
  });
