import AsyncStorage from '@react-native-async-storage/async-storage';
import {Coords, Prefs, ROWS, Row, defaultPrefs, timesFor} from './times';

export type SalatContext = {coords: Coords | null; timeZone?: string; place?: string; prefs: Prefs};

// The place and method chosen on the Salat screen (a picked place wins over the device fix).
export async function loadSalatContext(): Promise<SalatContext> {
  try {
    const [loc, pr, man] = await Promise.all([
      AsyncStorage.getItem('salat.location.v1'),
      AsyncStorage.getItem('salat.prefs.v1'),
      AsyncStorage.getItem('salat.manual.v1'),
    ]);
    const manual = man ? JSON.parse(man) : null;
    const saved = pr ? JSON.parse(pr) : {};
    return {
      coords: manual ?? (loc ? JSON.parse(loc) : null),
      timeZone: manual?.timeZone,
      place: manual?.name,
      prefs: {...defaultPrefs, ...saved, alarms: {...defaultPrefs.alarms, ...saved.alarms}},
    };
  } catch {
    return {coords: null, prefs: defaultPrefs};
  }
}

export type PrayerWindow = {
  today: Record<Row, Date>;
  prev: {row: Row; at: Date};
  next: {row: Row; at: Date};
  progress: number; // 0-1 through the gap between prev and next
};

// The gap `now` falls in: before Fajr it starts at yesterday's Isha, after Isha it ends at tomorrow's Fajr.
export function prayerWindow(c: Coords, prefs: Prefs, now: Date): PrayerWindow {
  const day = 86400000;
  const today = timesFor(c, prefs, now);
  const at = Object.fromEntries(ROWS.map(r => [r, today[r]])) as Record<Row, Date>;
  const seq: {row: Row; at: Date}[] = [
    {row: 'isha', at: timesFor(c, prefs, new Date(now.getTime() - day)).isha},
    ...ROWS.map(r => ({row: r, at: at[r]})),
    {row: 'fajr', at: timesFor(c, prefs, new Date(now.getTime() + day)).fajr},
  ];
  let i = seq.findIndex(p => p.at.getTime() > now.getTime());
  i = i < 1 ? 1 : i;
  const prev = seq[i - 1];
  const next = seq[i];
  const span = next.at.getTime() - prev.at.getTime();
  const progress = span > 0 ? Math.min(1, Math.max(0, (now.getTime() - prev.at.getTime()) / span)) : 0;
  return {today: at, prev, next, progress};
}
