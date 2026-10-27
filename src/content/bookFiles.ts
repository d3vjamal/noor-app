import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {Book} from './books';

export type BookFiles =
  | {status: 'loading'; progress: number}
  | {status: 'error'}
  | {status: 'ready'; uri: string; pages: string[]};

const {fs} = ReactNativeBlobUtil;
const dir = `${fs.dirs.DocumentDir}/books`;

// Short stable hash so a changed URL (new upload) is downloaded again instead of served stale.
const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
};

async function download(
  url: string,
  path: string,
  onProgress?: (p: number) => void,
) {
  if (await fs.exists(path)) {
    return path;
  }
  await fs.mkdir(dir).catch(() => {});
  const tmp = `${path}.part`;
  const res = await ReactNativeBlobUtil.config({path: tmp})
    .fetch('GET', url)
    .progress((got, total) => {
      if (onProgress && Number(total) > 0) {
        onProgress(Number(got) / Number(total));
      }
    });
  if (res.info().status !== 200) {
    await fs.unlink(tmp).catch(() => {});
    throw new Error(`HTTP ${res.info().status}`);
  }
  await fs.mv(tmp, path);
  return path;
}

// Drop older downloads of the same book (previous uploads).
async function prune(id: string, keep: string[]) {
  try {
    for (const name of await fs.ls(dir)) {
      if (name.startsWith(`${id}-`) && !keep.some(k => k.endsWith(name))) {
        await fs.unlink(`${dir}/${name}`).catch(() => {});
      }
    }
  } catch {}
}

// Resolves a book to a local PDF file (downloaded once, then offline) plus its text pages.
export function useBookFiles(book: Book): BookFiles {
  const [state, setState] = useState<BookFiles>({
    status: 'loading',
    progress: 0,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!book.pdfUrl) {
        setState({
          status: 'ready',
          uri:
            Platform.OS === 'android'
              ? `bundle-assets://${book.asset}`
              : book.asset!,
          pages: book.pages ?? [],
        });
        return;
      }
      try {
        const pdfPath = await download(
          book.pdfUrl,
          `${dir}/${book.id}-${hash(book.pdfUrl)}.pdf`,
          p => alive && setState({status: 'loading', progress: p}),
        );
        let pages: string[] = [];
        const keep = [pdfPath];
        if (book.textUrl) {
          try {
            const textPath = await download(
              book.textUrl,
              `${dir}/${book.id}-${hash(book.textUrl)}.json`,
            );
            keep.push(textPath);
            pages = JSON.parse(await fs.readFile(textPath, 'utf8')).pages ?? [];
          } catch {} // text is optional: reading still works, Listen just has nothing to say
        }
        prune(book.id, keep);
        if (alive) {
          setState({status: 'ready', uri: `file://${pdfPath}`, pages});
        }
      } catch {
        if (alive) {
          setState({status: 'error'});
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [book]);

  return state;
}
