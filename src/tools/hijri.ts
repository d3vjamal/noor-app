// Tabular (civil) Islamic calendar: deterministic and offline. Real months follow moon
// sighting, so the UI lets the user shift the result by a day or two.
const div = (a: number, b: number) => Math.floor(a / b);

export type HijriDate = {year: number; month: number; day: number}; // month 1-12

// Fliegel-Van Flandern: needs truncating (not flooring) division for Jan/Feb.
function toJulian(y: number, m: number, d: number): number {
  const a = Math.trunc((m - 14) / 12);
  return (
    div(1461 * (y + 4800 + a), 4) +
    div(367 * (m - 2 - 12 * a), 12) -
    div(3 * div(y + 4900 + a, 100), 4) +
    d -
    32075
  );
}

export function toHijri(date: Date, offsetDays = 0): HijriDate {
  const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays);
  const jd = toJulian(shifted.getFullYear(), shifted.getMonth() + 1, shifted.getDate());
  let l = jd - 1948440 + 10632;
  const n = div(l - 1, 10631);
  l = l - 10631 * n + 354;
  const j = div(10985 - l, 5316) * div(50 * l, 17719) + div(l, 5670) * div(43 * l, 15238);
  l = l - div(30 - j, 15) * div(17719 * j, 50) - div(j, 16) * div(15238 * j, 43) + 29;
  const month = div(24 * l, 709);
  return {year: 30 * n + j - 30, month, day: l - div(709 * month, 24)};
}

// Gregorian date of a Hijri date (before any user offset): start from an estimate and
// walk until toHijri agrees, so the two directions can never disagree.
export function fromHijri(h: HijriDate): Date {
  const days = (x: HijriDate) => x.year * 354.367 + (x.month - 1) * 29.53 + x.day;
  let g = new Date(2000, 0, 1);
  for (let i = 0; i < 40; i++) {
    const cur = toHijri(g);
    if (cur.year === h.year && cur.month === h.month && cur.day === h.day) {
      return g;
    }
    const step = Math.round(days(h) - days(cur));
    g = new Date(g.getFullYear(), g.getMonth(), g.getDate() + (step === 0 ? Math.sign(days(h) - days(cur)) || 1 : step));
  }
  return g;
}

// Month length taken from the calendar itself: the distance between two first-of-months.
export function daysInMonth(year: number, month: number): number {
  const start = fromHijri({year, month, day: 1});
  const next = fromHijri(month === 12 ? {year: year + 1, month: 1, day: 1} : {year, month: month + 1, day: 1});
  return Math.round((next.getTime() - start.getTime()) / 86400000);
}

export const OCCASIONS: {month: number; day: number; key: string}[] = [
  {month: 1, day: 1, key: 'ev_newyear'},
  {month: 1, day: 10, key: 'ev_ashura'},
  {month: 7, day: 27, key: 'ev_miraj'},
  {month: 8, day: 15, key: 'ev_baraat'},
  {month: 9, day: 1, key: 'ev_ramadan'},
  {month: 9, day: 27, key: 'ev_qadr'},
  {month: 10, day: 1, key: 'ev_fitr'},
  {month: 12, day: 9, key: 'ev_arafah'},
  {month: 12, day: 10, key: 'ev_adha'},
];
