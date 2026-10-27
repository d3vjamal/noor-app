import {useCallback, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ConvexHttpClient} from 'convex/browser';
import {CONVEX_URL} from '../../config/convex';
import bundled from '../../assets/content/playlists.json';
import {Playlist} from './types';

const CACHE_KEY = 'playlists.cache.v1';

const fallback: Playlist[] = bundled.playlists.map(p => ({
  slug: p.id,
  title: p.title,
  type: p.type as Playlist['type'],
  provider: p.provider as Playlist['provider'],
  url: p.url,
  thumbnail: p.thumbnail,
}));

// Convex is the source of truth (even when empty); cached/bundled copies only cover being offline.
export function usePlaylists(): {
  items: Playlist[];
  refresh: () => Promise<void>;
  refreshing: boolean;
} {
  const [items, setItems] = useState<Playlist[]>(fallback);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!CONVEX_URL) {
      return;
    }
    setRefreshing(true);
    try {
      const client = new ConvexHttpClient(CONVEX_URL);
      const remote = (await client.query('playlists:list' as any, {})) as Playlist[];
      setItems(remote);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remote)).catch(() => {});
    } catch {} // offline: keep cached/bundled
    setRefreshing(false);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && alive) {
          setItems(JSON.parse(cached));
        }
      } catch {}
      if (alive) {
        refresh();
      }
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  return {items, refresh, refreshing};
}
