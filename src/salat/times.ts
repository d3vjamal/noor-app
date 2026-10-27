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
