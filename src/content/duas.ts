import {useRemote} from './remote';

export type Dua = {
  id: string;
  category: string;
  title: {bn: string; en: string};
  arabic: string;
  meaning: {bn: string; en: string};
  source: {bn: string; en: string};
  audioUrls?: string[];
  transliteration?: string;
  repeat?: number;
};

type Doc = {
  slug: string;
  category: string;
  titleBn: string;
  titleEn: string;
  arabic: string;
  meaningBn: string;
  meaningEn: string;
  sourceBn: string;
  sourceEn: string;
  audioUrls?: string[];
  transliteration?: string;
  repeat?: number;
};

export function useDuas() {
  return useRemote<Doc[], Dua[]>('duas', 'content:duas', {}, rows =>
    rows.map(d => ({
      id: d.slug,
      category: d.category,
      title: {bn: d.titleBn || d.titleEn, en: d.titleEn},
      arabic: d.arabic,
      meaning: {bn: d.meaningBn || d.meaningEn, en: d.meaningEn},
      source: {bn: d.sourceBn || d.sourceEn, en: d.sourceEn},
      audioUrls: d.audioUrls,
      transliteration: d.transliteration,
      repeat: d.repeat,
    })),
  );
}
