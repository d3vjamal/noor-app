import AsyncStorage from '@react-native-async-storage/async-storage';

// Daily record of the five prayers, shared by the Prayer tracker tool and the Home feed card.
export const PRAYER_LOG_KEY = 'tools.prayerlog.v1';
export const FIVE = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type FivePrayer = (typeof FIVE)[number];
export type PrayerLog = Record<string, Partial<Record<FivePrayer, boolean>>>;

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export async function loadPrayerLog(): Promise<PrayerLog> {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_LOG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const savePrayerLog = (log: PrayerLog) =>
  AsyncStorage.setItem(PRAYER_LOG_KEY, JSON.stringify(log)).catch(() => {});

export const prayedCount = (log: PrayerLog, key: string) => FIVE.filter(p => log[key]?.[p]).length;

// Days in a row with all five prayers; today only counts once it is complete.
export function prayerStreak(log: PrayerLog): number {
  let n = 0;
  for (let i = prayedCount(log, dayKey(new Date())) === 5 ? 0 : 1; ; i++) {
    if (prayedCount(log, dayKey(new Date(Date.now() - i * 86400000))) === 5) {
      n++;
    } else {
      return n;
    }
  }
}
