import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import Icon from './Icon';

// A swinging lantern and twinkling stars: a small looping animation for the top of a hero card.
const H = 40;
export default function HeroSky({color}: {color: string}) {
  const swing = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(swing, {toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(swing, {toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {toValue: 1, duration: 1100, useNativeDriver: true}),
        Animated.timing(twinkle, {toValue: 0, duration: 1100, useNativeDriver: true}),
      ]),
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [swing, twinkle]);

  const rotate = swing.interpolate({inputRange: [0, 1], outputRange: ['-12deg', '12deg']});
  const fade = twinkle.interpolate({inputRange: [0, 1], outputRange: [0.25, 1]});
  const fadeB = twinkle.interpolate({inputRange: [0, 1], outputRange: [1, 0.25]});

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.star, {left: -34, top: 4, opacity: fade}]}>
        <Icon name="crescent" color={color} size={16} />
      </Animated.View>
      <Animated.View style={[styles.star, {left: -12, top: 18, opacity: fadeB}]}>
        <Icon name="names" color={color} size={10} />
      </Animated.View>
      <Animated.View style={{transform: [{translateY: -H / 2}, {rotate}, {translateY: H / 2}]}}>
        <Icon name="lantern" color={color} size={H} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {position: 'absolute', top: 0, right: 18, width: H, height: H + 6},
  star: {position: 'absolute'},
});
