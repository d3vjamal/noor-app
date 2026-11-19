// Audio lectures, discussions and debates come from free podcasts. Shows are found live through the
// public iTunes Search API (no key) and episodes are read from each show's own RSS feed, so there are
// no fixed links to go stale and nothing here is a video.
export type Category = {id: string; label: {bn: string; en: string}; term: string};

export const CATEGORIES: Category[] = [
  {id: 'debate', label: {bn: 'বিতর্ক', en: 'Debates'}, term: 'muslim christian dialogue debate'},
  {id: 'discuss', label: {bn: 'আলোচনা', en: 'Discussions'}, term: 'islamic discussion podcast'},
  {id: 'lectures', label: {bn: 'লেকচার', en: 'Lectures'}, term: 'islamic lectures'},
  {id: 'tafsir', label: {bn: 'তাফসীর', en: 'Tafsir'}, term: 'quran tafsir'},
  {id: 'seerah', label: {bn: 'সীরাত', en: 'Seerah'}, term: 'seerah prophet muhammad'},
  {id: 'bangla', label: {bn: 'বাংলা', en: 'Bangla'}, term: 'bangla waz'},
];

export type Show = {id: number; name: string; artist: string; art?: string; feedUrl: string};
export type Episode = {id: string; title: string; url: string; date?: string};

const showCache: Record<string, Show[]> = {};
const epCache: Record<string, Episode[]> = {};

export async function searchShows(term: string): Promise<Show[]> {
  if (showCache[term]) {
    return showCache[term];
  }
  const res = await fetch(
    `https://itunes.apple.com/search?media=podcast&limit=25&term=${encodeURIComponent(term)}`,
  );
  const json = await res.json();
  const shows: Show[] = (json.results ?? [])
    .filter((r: any) => r.feedUrl)
    .map((r: any) => ({
      id: r.collectionId,
      name: r.collectionName,
      artist: r.artistName,
      art: r.artworkUrl100,
      feedUrl: r.feedUrl,
    }));
  showCache[term] = shows;
  return shows;
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

// RN has no DOMParser, so the feed is read with regexes: each <item>'s title and audio enclosure.
export async function loadEpisodes(feedUrl: string): Promise<Episode[]> {
  if (epCache[feedUrl]) {
    return epCache[feedUrl];
  }
  const xml = await (await fetch(feedUrl.replace(/^http:/, 'https:'))).text();
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/g) ?? [];
  const eps: Episode[] = [];
  for (const it of items.slice(0, 40)) {
    const url = it.match(/<enclosure[^>]*\surl=["']([^"']+)["']/i)?.[1];
    const title = it.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    if (!url || !title) {
      continue;
    }
    const date = it.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1];
    eps.push({
      id: url,
      title: decode(title),
      url: decode(url).replace(/^http:/, 'https:'),
      date: date ? decode(date).slice(5, 16) : undefined,
    });
  }
  epCache[feedUrl] = eps;
  return eps;
}
