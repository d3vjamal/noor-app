import {useCallback, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ConvexHttpClient} from 'convex/browser';
import {BOOK_TITLE} from '../../config/appConfig';
import {CONVEX_URL} from '../../config/convex';

export type Book = {
  id: string;
  title: {bn: string; en: string};
  pdfUrl?: string; // Convex file storage (or any) URL
  textUrl?: string; // JSON {pages: string[]} with OCR text per page, for text-to-speech
  asset?: string; // bundled PDF in android/app/src/main/assets, used when there is no pdfUrl
  pages?: string[]; // bundled OCR text (index 0 = page 1)
};

type RemoteBook = {
  slug: string;
  title: string;
  titleEn?: string;
  pdfUrl: string | null;
  textUrl: string | null;
};

const CACHE_KEY = 'books.cache.v1';

// Offline / not-yet-uploaded fallback: the PDF shipped inside the app. Text and the book list come from Convex.
const bundled: Book[] = [
  {
    id: 'muntakhab-ahadis',
    title: BOOK_TITLE,
    asset: 'hadis.pdf',
    pages: [], // OCR text now comes from Convex with the book
  },
];

function fromRemote(r: RemoteBook): Book | null {
  if (!r.pdfUrl) {
    return null;
  }
  return {
    id: r.slug,
    title: {bn: r.title, en: r.titleEn || r.title},
    pdfUrl: r.pdfUrl,
    textUrl: r.textUrl ?? undefined,
  };
}

// Convex (fresh) -> last cached list -> bundled book. A non-empty Convex list replaces the bundled book.
export function useBooks(): {
  items: Book[];
  refresh: () => Promise<void>;
  refreshing: boolean;
} {
  const [items, setItems] = useState<Book[]>(bundled);
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh skips the cache and goes straight to Convex.
  const refresh = useCallback(async () => {
    if (!CONVEX_URL) {
      return;
    }
    setRefreshing(true);
    try {
      const client = new ConvexHttpClient(CONVEX_URL);
      const remote = (await client.query('books:list' as any, {})) as RemoteBook[];
      const list = remote.map(fromRemote).filter((b): b is Book => !!b);
      setItems(list.length ? list : bundled);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list)).catch(() => {});
    } catch {} // offline: keep what is shown
    setRefreshing(false);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && alive) {
          const list = JSON.parse(cached) as Book[];
          if (list.length) {
            setItems(list);
          }
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
