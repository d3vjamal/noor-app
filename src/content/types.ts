export type Playlist = {
  slug: string;
  title: string;
  titleEn?: string;
  type: 'audio' | 'video';
  provider: 'youtube' | 'spotify';
  url: string;
  thumbnail?: string;
  description?: string;
};
