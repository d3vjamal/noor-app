import {Playlist} from './types';

// Turn a public Spotify/YouTube URL into an embeddable one. Returns null if unrecognised.
// Regex on purpose: React Native's URL polyfill lacks pathname/searchParams.
export function embedUrl(p: Pick<Playlist, 'provider' | 'url'>): string | null {
  const url = p.url.trim();
  if (p.provider === 'spotify') {
    const m = url.match(
      /spotify\.com\/(?:intl-[a-z]+\/)?(show|episode|playlist|album|track|artist)\/([A-Za-z0-9]+)/,
    );
    return m
      ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`
      : null;
  }
  const list = url.match(/[?&]list=([\w-]+)/);
  if (list) {
    return `https://www.youtube.com/embed/videoseries?list=${list[1]}`;
  }
  const video =
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/[?&]v=([\w-]{6,})/) ||
    url.match(/youtube\.com\/(?:embed|shorts|live)\/([\w-]{6,})/);
  return video ? `https://www.youtube.com/embed/${video[1]}` : null;
}
