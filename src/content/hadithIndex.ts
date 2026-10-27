import {loadContent, useRemote} from './remote';

export type HadithSection = {id: string; name: string; count: number};
export type HadithBook = {id: string; title: {bn: string; en: string}; sections: HadithSection[]};
// [number, bangla, english, urdu]; a missing translation is ''.
export type HadithRow = [number, string, string, string];

type BookDoc = {bookId: string; titleBn: string; titleEn: string; sections: HadithSection[]};
type HadithDoc = {number: number; bn?: string; en?: string; ur?: string};

export function useHadithBooks() {
  return useRemote<BookDoc[], HadithBook[]>('hadith-books', 'content:hadithBooks', {}, rows =>
    rows.map(b => ({id: b.bookId, title: {bn: b.titleBn, en: b.titleEn}, sections: b.sections})),
  );
}

// One section at a time, cached on the device after the first open.
export async function loadSection(bookId: string, sectionId: string): Promise<HadithRow[]> {
  const rows = await loadContent<HadithDoc[]>(
    `hadith-${bookId}-${sectionId}`,
    'content:hadithSection',
    {book: bookId, section: sectionId},
  );
  return (rows ?? []).map(h => [h.number, h.bn ?? '', h.en ?? '', h.ur ?? '']);
}
