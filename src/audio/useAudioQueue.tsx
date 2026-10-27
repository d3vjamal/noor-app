import React, {useCallback, useState} from 'react';
import Video from 'react-native-video';

// Streams a list of recordings one after another (a reciter's files). Render `element` once in the
// screen; it is invisible and stops by itself when the screen unmounts.
export function useAudioQueue() {
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [key, setKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const stop = useCallback(() => {
    setKey(null);
    setQueue([]);
    setIndex(0);
    setLoading(false);
  }, []);

  const play = useCallback((k: string, urls: string[]) => {
    setFailed(false);
    setKey(k);
    setQueue(urls);
    setIndex(0);
    setLoading(true);
  }, []);

  const element = queue.length ? (
    <Video
      key={`${key}-${index}`}
      source={{uri: queue[index]}}
      ignoreSilentSwitch="ignore"
      playInBackground={false}
      style={{width: 0, height: 0}}
      onLoad={() => setLoading(false)}
      onEnd={() => {
        if (index + 1 < queue.length) {
          setIndex(index + 1);
          setLoading(true);
        } else {
          stop();
        }
      }}
      onError={() => {
        setFailed(true);
        stop();
      }}
    />
  ) : null;

  return {key, index, loading, failed, play, stop, element};
}
