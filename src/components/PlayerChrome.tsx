import React, {useEffect, useMemo, useRef} from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Radio, useRadio} from '../theme/radio';

export const fmt = (s: number) => {
  const t = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

export function Vinyl({
  size,
  spinning,
  cover,
}: {
  size: number;
  spinning: boolean;
  cover?: string;
}) {
  const radio = useRadio();
  const styles = useMemo(() => makeStyles(radio), [radio]);
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!spinning) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spinning, spin]);
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  return (
    <View style={{width: size, height: size}}>
      <Animated.View
        style={[
          styles.disc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{rotate}],
          },
        ]}>
        {cover ? (
          <Image source={{uri: cover}} style={{width: size, height: size}} />
        ) : (
          <Text style={{color: radio.amber, fontSize: size * 0.4}}>♪</Text>
        )}
      </Animated.View>
      <View style={[styles.hole, {top: size / 2 - 5, left: size / 2 - 5}]} />
    </View>
  );
}

type Props = {
  title: string;
  station: string;
  cover?: string;
  playing: boolean;
  time: number;
  duration: number;
  onSeek: (sec: number) => void;
  // Optional message replacing the title (e.g. playback error)
  notice?: string;
  children: React.ReactNode; // control buttons
};

// Glass "now playing" card shared by the YouTube and Spotify players.
export default function PlayerChrome({
  title,
  station,
  cover,
  playing,
  time,
  duration,
  onSeek,
  notice,
  children,
}: Props) {
  const radio = useRadio();
  const styles = useMemo(() => makeStyles(radio), [radio]);
  const barW = useRef(1);
  const pct = duration ? Math.min(1, time / duration) : 0;
  return (
    <View style={styles.wrap}>
      <Vinyl size={170} spinning={playing} cover={cover} />
      <View style={styles.card}>
        <Text style={styles.station}>{station}</Text>
        <Text numberOfLines={2} style={styles.title}>
          {notice || title || '…'}
        </Text>
        <View style={styles.progressRow}>
          <Text style={styles.time}>{fmt(time)}</Text>
          <Pressable
            accessibilityRole="adjustable"
            onLayout={e => (barW.current = e.nativeEvent.layout.width)}
            onPress={e =>
              duration &&
              onSeek((e.nativeEvent.locationX / barW.current) * duration)
            }
            style={styles.barHit}>
            <View style={styles.bar}>
              <View
                style={{
                  width: `${pct * 100}%`,
                  height: 5,
                  backgroundColor: radio.amber,
                }}
              />
            </View>
          </Pressable>
          <Text style={styles.time}>{fmt(duration)}</Text>
        </View>
        <View style={styles.controls}>{children}</View>
      </View>
    </View>
  );
}

export function RoundBtn({
  label,
  onPress,
  desc,
  big,
}: {
  label: string;
  onPress: () => void;
  desc: string;
  big?: boolean;
}) {
  const radio = useRadio();
  const styles = useMemo(() => makeStyles(radio), [radio]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={desc}
      onPress={onPress}
      style={[styles.btn, big ? styles.btnBig : styles.btnSmall]}>
      <Text
        style={{
          color: big ? radio.onAccent : radio.text,
          fontSize: big ? 22 : 17,
          fontWeight: '700',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (radio: Radio) =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      gap: 20,
    },
    disc: {
      backgroundColor: radio.disc,
      borderWidth: 2,
      borderColor: radio.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    hole: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: radio.bg,
      borderWidth: 1,
      borderColor: radio.glassBorder,
    },
    card: {
      width: '100%',
      maxWidth: 580,
      backgroundColor: radio.glass,
      borderColor: radio.glassBorder,
      borderWidth: 1,
      borderRadius: 24,
      padding: 18,
      gap: 6,
    },
    station: {color: radio.muted, fontSize: 12},
    title: {color: radio.text, fontSize: 17, lineHeight: 26, fontWeight: '700'},
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    time: {
      color: radio.muted,
      fontSize: 11,
      fontFamily: 'monospace',
      width: 40,
      textAlign: 'center',
    },
    barHit: {flex: 1, height: 28, justifyContent: 'center'},
    bar: {
      height: 5,
      borderRadius: 3,
      backgroundColor: radio.track,
      overflow: 'hidden',
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 14,
      marginTop: 6,
    },
    btn: {alignItems: 'center', justifyContent: 'center', borderRadius: 40},
    btnSmall: {
      width: 52,
      height: 52,
      backgroundColor: radio.chip,
      borderColor: radio.glassBorder,
      borderWidth: 1,
    },
    btnBig: {
      width: 68,
      height: 68,
      backgroundColor: radio.amber,
      borderColor: radio.glassBorder,
      borderWidth: 1,
    },
  });
