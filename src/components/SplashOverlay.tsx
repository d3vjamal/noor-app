import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import HeroSky from './HeroSky';
import MasjidArt from './MasjidArt';
import {useSettings} from '../state/settings';

// Shown right after the system splash: the name and tagline over a green screen, then it fades
// away. It waits for saved settings so the right language and theme appear without a flash.
const MIN_MS = 1600;

export default function SplashOverlay() {
  const {ready, appName, tagline} = useSettings();
  const fade = useRef(new Animated.Value(1)).current;
  const [gone, setGone] = useState(false);
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMinDone(true), MIN_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (ready && minDone) {
      Animated.timing(fade, {toValue: 0, duration: 450, useNativeDriver: true}).start(() => setGone(true));
    }
  }, [ready, minDone, fade]);

  if (gone) {
    return null;
  }
  return (
    <Animated.View style={[styles.root, {opacity: fade}]} pointerEvents={ready && minDone ? 'none' : 'auto'}>
      <View style={styles.sky}>
        <HeroSky color="#FFFFFF" />
      </View>
      <Text style={styles.name}>{appName}</Text>
      <Text style={styles.tag}>{tagline}</Text>
      <View style={styles.art} pointerEvents="none">
        <MasjidArt color="#FFFFFF" width={320} />
      </View>
    </Animated.View>
  );
}

// Fixed colours: matches the native splash background so there is no jump between the two.
const styles = StyleSheet.create({
  root: {...StyleSheet.absoluteFillObject, backgroundColor: '#0F6B4F', alignItems: 'center', justifyContent: 'center', padding: 32},
  sky: {position: 'absolute', top: 90, left: 0, right: 0, height: 50},
  name: {color: '#FFFFFF', fontSize: 44, fontWeight: '800', marginBottom: 10},
  tag: {color: '#FFFFFF', opacity: 0.9, fontSize: 16, lineHeight: 24, textAlign: 'center'},
  art: {position: 'absolute', bottom: 0, opacity: 0.16},
});
