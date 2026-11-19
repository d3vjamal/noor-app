import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  Madhab,
  PrayerTimes,
} from 'adhan';

export type Coords = {latitude: number; longitude: number};
export type MethodKey = 'karachi' | 'mwl' | 'egyptian' | 'ummalqura' | 'isna';
export const ROWS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type Row = (typeof ROWS)[number];
export type AlarmMode = 'off' | 'vibrate' | 'sound';
export type Prefs = {
  method: MethodKey;
  hanafi: boolean;
  alarms: Record<Row, AlarmMode>;
  endWarn: number; // minutes before a waqt ends to remind again; 0 = off
};

export const METHODS: Record<MethodKey, () => CalculationParameters> = {
  karachi: CalculationMethod.Karachi,
  mwl: CalculationMethod.MuslimWorldLeague,
  egyptian: CalculationMethod.Egyptian,
  ummalqura: CalculationMethod.UmmAlQura,
  isna: CalculationMethod.NorthAmerica,
};

// Bangladesh default: Karachi method with Hanafi Asr; reminders start off.
export const defaultPrefs: Prefs = {
  method: 'karachi',
  hanafi: true,
  endWarn: 0,
  alarms: {
    fajr: 'off',
    sunrise: 'off',
    dhuhr: 'off',
    asr: 'off',
    maghrib: 'off',
    isha: 'off',
  },
};

export function timesFor(c: Coords, prefs: Prefs, date: Date): PrayerTimes {
  const params = METHODS[prefs.method]();
  params.madhab = prefs.hanafi ? Madhab.Hanafi : Madhab.Shafi;
  return new PrayerTimes(new Coordinates(c.latitude, c.longitude), date, params);
}

export function formatTime(d: Date, locale: string, timeZone?: string): string {
  return d.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    ...(timeZone ? {timeZone} : {}),
  });
}

// Sunrise is not a prayer; the window right after it (until the sun has risen a spear's length) is
// when prayer is disliked, so its range is shown as the first 15 minutes.
const SUNRISE_WINDOW_MS = 15 * 60000;

// When each waqt ends: Fajr at sunrise, Dhuhr at Asr, Asr at Maghrib, Maghrib at Isha, and Isha at
// the next day's Fajr.
export function waqtEnds(c: Coords, prefs: Prefs, date: Date): Record<Row, Date> {
  const t = timesFor(c, prefs, date);
  const tomorrow = timesFor(c, prefs, new Date(date.getTime() + 86400000));
  return {
    fajr: t.sunrise,
    sunrise: new Date(t.sunrise.getTime() + SUNRISE_WINDOW_MS),
    dhuhr: t.asr,
    asr: t.maghrib,
    maghrib: t.isha,
    isha: tomorrow.fajr,
  };
}
