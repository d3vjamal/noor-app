import {loadContent, useRemote} from './remote';

export type Surah = {
  number: number;
  nameAr: string;
  nameEn: string;
  meaningEn: string;
  revelation: string;
  ayahCount: number;
};
export type Ayah = {number: number; ar: string; bn?: string; en?: string; ur?: string};

export function useSurahs() {
  return useRemote<Surah[]>('surahs', 'content:surahs');
}

export async function loadAyahs(surah: number): Promise<Ayah[]> {
  return (await loadContent<Ayah[]>(`ayahs-${surah}`, 'content:ayahs', {surah})) ?? [];
}

// Reciters streamed from the Al Quran Cloud audio CDN (one MP3 per ayah). `kbps` is the highest
// bitrate the CDN holds for that reciter.
export type Reciter = {id: string; kbps: number; name: {bn: string; en: string}};
export const RECITERS: Reciter[] = [
  {id: 'ar.alafasy', kbps: 128, name: {bn: 'মিশারি আলাফাসি', en: 'Mishary Alafasy'}},
  {id: 'ar.abdurrahmaansudais', kbps: 192, name: {bn: 'আবদুর রহমান আস-সুদাইস', en: 'Abdul Rahman As-Sudais'}},
  {id: 'ar.mahermuaiqly', kbps: 128, name: {bn: 'মাহের আল-মুয়াইকিলি', en: 'Maher Al-Muaiqly'}},
  {id: 'ar.husary', kbps: 128, name: {bn: 'মাহমুদ খলিল আল-হুসারি', en: 'Mahmoud Khalil Al-Husary'}},
  {id: 'ar.abdulbasitmurattal', kbps: 192, name: {bn: 'আবদুল বাসিত (মুরাত্তাল)', en: 'Abdul Basit (Murattal)'}},
  {id: 'ar.saoodshuraym', kbps: 64, name: {bn: 'সউদ আশ-শুরাইম', en: 'Saud Ash-Shuraim'}},
];

// Position of an ayah in the whole Quran (1-6236), which is how the CDN numbers its files.
export function globalAyah(surahs: Surah[], surah: number, ayah: number): number {
  return surahs.filter(s => s.number < surah).reduce((n, s) => n + s.ayahCount, 0) + ayah;
}

export const ayahAudioUrl = (r: Reciter, n: number) =>
  `https://cdn.islamic.network/quran/audio/${r.kbps}/${r.id}/${n}.mp3`;
