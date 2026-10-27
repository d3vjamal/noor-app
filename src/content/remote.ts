import {useCallback, useEffect, useRef, useState} from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {ConvexHttpClient} from 'convex/browser';
import {CONVEX_URL} from '../../config/convex';

// Content lives in Convex. Every result is cached as a file on the device (AsyncStorage's
// ~6 MB Android limit is too small for hadith/Quran sections), so it reads offline once opened.
const fs = ReactNativeBlobUtil.fs;
const DIR = `${fs.dirs.DocumentDir}/content-cache`;

let client: ConvexHttpClient | null = null;

const fileFor = (key: string) => `${DIR}/${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const path = fileFor(key);
    if (!(await fs.exists(path))) {
      return null;
    }
    return JSON.parse(await fs.readFile(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

async function writeCache(key: string, data: unknown) {
  try {
    if (!(await fs.isDir(DIR))) {
      await fs.mkdir(DIR);
    }
    await fs.writeFile(fileFor(key), JSON.stringify(data), 'utf8');
  } catch {}
}

export async function queryConvex<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  client = client ?? new ConvexHttpClient(CONVEX_URL);
  return (await client.query(fn as any, args as any)) as T;
}

// Cached copy first, then the network; null when neither is available.
export async function loadContent<T>(key: string, fn: string, args: Record<string, unknown> = {}): Promise<T | null> {
  const cached = await readCache<T>(key);
  if (cached) {
    return cached;
  }
  return fetchContent<T>(key, fn, args);
}

export async function fetchContent<T>(key: string, fn: string, args: Record<string, unknown> = {}): Promise<T | null> {
  try {
    const fresh = await queryConvex<T>(fn, args);
    writeCache(key, fresh);
    return fresh;
  } catch {
    return readCache<T>(key); // offline: whatever we have
  }
}

export type Remote<T> = {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
};

// Shows the cached copy immediately, refreshes from Convex in the background, and
// exposes refresh() for pull-to-refresh. Pass `map` to reshape rows (kept out of deps).
export function useRemote<R, T = R>(
  key: string,
  fn: string,
  args: Record<string, unknown> = {},
  map?: (rows: R) => T,
): Remote<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef(map);
  mapRef.current = map;
  const argsKey = JSON.stringify(args);

  const apply = useCallback((rows: R | null) => {
    if (rows) {
      setData(mapRef.current ? mapRef.current(rows) : (rows as unknown as T));
    }
  }, []);

  useEffect(() => {
    let alive = true;
    setData(null);
    setLoading(true);
    (async () => {
      const cached = await readCache<R>(key);
      if (alive && cached) {
        apply(cached);
        setLoading(false);
      }
      const fresh = await fetchContent<R>(key, fn, JSON.parse(argsKey));
      if (alive) {
        apply(fresh);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [key, fn, argsKey, apply]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    apply(await fetchContent<R>(key, fn, JSON.parse(argsKey)));
    setRefreshing(false);
  }, [key, fn, argsKey, apply]);

  return {data, loading, refreshing, refresh};
}
