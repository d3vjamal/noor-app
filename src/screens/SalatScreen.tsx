import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import {useSettings} from '../state/settings';
import {
  reminderAccess,
  requestReminderAccess,
  rescheduleReminders,
} from '../salat/reminders';
import {
  AlarmMode,
  Coords,
  METHODS,
  MethodKey,
  Prefs,
  ROWS,
  Row,
  defaultPrefs,
  formatTime,
  timesFor,
} from '../salat/times';

type Manual = Coords & {name: string; timeZone?: string};
type Found = Manual & {id: number};

const LOCATION_KEY = 'salat.location.v1';
const PREFS_KEY = 'salat.prefs.v1';
const MANUAL_KEY = 'salat.manual.v1';
const PLACES_KEY = 'salat.places.v1';

const NEXT_MODE: Record<AlarmMode, AlarmMode> = {
  off: 'vibrate',
  vibrate: 'sound',
  sound: 'off',
};
const MODE_ICON: Record<AlarmMode, string> = {off: '🔕', vibrate: '📳', sound: '🔔'};

// Free, keyless place search (Open-Meteo); names come back in the app language.
async function searchPlaces(q: string, lang: string): Promise<Found[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q,
    )}&count=8&language=${lang}`,
  );
  const d = await res.json();
  return (d.results || []).map((r: any) => ({
    id: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    timeZone: r.timezone,
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
  }));
}

// Free, keyless reverse geocoding meant for client apps; names come back in the app language.
async function lookupPlace(c: Coords, lang: string): Promise<string | null> {
  const key = `${c.latitude.toFixed(2)},${c.longitude.toFixed(2)},${lang}`;
  let cache: Record<string, string> = {};
  try {
    cache = JSON.parse((await AsyncStorage.getItem(PLACES_KEY)) || '{}');
    if (cache[key]) {
      return cache[key];
    }
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${c.latitude}&longitude=${c.longitude}&localityLanguage=${lang}`,
    );
    const d = await res.json();
    const name = [d.city || d.locality, d.countryName].filter(Boolean).join(', ');
    if (name) {
      cache[key] = name;
      AsyncStorage.setItem(PLACES_KEY, JSON.stringify(cache)).catch(() => {});
      return name;
    }
  } catch {}
  return null;
}

async function askPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const res = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  );
  return res === PermissionsAndroid.RESULTS.GRANTED;
}

function getPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      p => resolve({latitude: p.coords.latitude, longitude: p.coords.longitude}),
      reject,
      {enableHighAccuracy: false, timeout: 20000, maximumAge: 600000},
    );
  });
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function SalatScreen() {
  const {t, theme, settings} = useSettings();
  const insets = useSafeAreaInsets();
  const s = t.salat;
  const [device, setDevice] = useState<Coords | null>(null);
  const [manual, setManual] = useState<Manual | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'denied' | 'failed' | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [now, setNow] = useState(new Date());
  const [place, setPlace] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Found[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [needAccess, setNeedAccess] = useState(false);

  // The chosen place wins over the device location.
  const coords: Coords | null = manual ?? device;
  const timeZone = manual?.timeZone;

  // Tick every 20s so the countdown and "next prayer" stay current.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(id);
  }, []);

  const locate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (!(await askPermission())) {
        setError('denied');
        return;
      }
      const c = await getPosition();
      setDevice(c);
      setFromCache(false);
      AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(c)).catch(() => {});
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }, []);

  // Show saved choices immediately; only ask the device when no place was picked.
  useEffect(() => {
    (async () => {
      let picked = false;
      try {
        const [loc, pr, man] = await Promise.all([
          AsyncStorage.getItem(LOCATION_KEY),
          AsyncStorage.getItem(PREFS_KEY),
          AsyncStorage.getItem(MANUAL_KEY),
        ]);
        if (pr) {
          const saved = JSON.parse(pr);
          setPrefs({
            ...defaultPrefs,
            ...saved,
            alarms: {...defaultPrefs.alarms, ...saved.alarms},
          });
        }
        if (loc) {
          setDevice(JSON.parse(loc));
          setFromCache(true);
        }
        if (man) {
          setManual(JSON.parse(man));
          picked = true;
        }
      } catch {}
      if (!picked) {
        locate();
      }
    })();
  }, [locate]);

  // Name for device locations; a picked place already has one.
  useEffect(() => {
    setPlace(null);
    if (!device || manual) {
      return;
    }
    let alive = true;
    lookupPlace(device, settings.language).then(n => alive && setPlace(n));
    return () => {
      alive = false;
    };
  }, [device, manual, settings.language]);

  const updatePrefs = (patch: Partial<Prefs>) =>
    setPrefs(prev => {
      const next = {...prev, ...patch};
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

  const pickPlace = (f: Found | null) => {
    const m: Manual | null = f
      ? {
          latitude: f.latitude,
          longitude: f.longitude,
          name: f.name,
          timeZone: f.timeZone,
        }
      : null;
    setManual(m);
    if (m) {
      AsyncStorage.setItem(MANUAL_KEY, JSON.stringify(m)).catch(() => {});
    } else {
      AsyncStorage.removeItem(MANUAL_KEY).catch(() => {});
      locate();
    }
    setPicker(false);
    setQuery('');
    setFound(null);
  };

  const runSearch = async () => {
    if (query.trim().length < 2) {
      return;
    }
    setSearching(true);
    try {
      setFound(await searchPlaces(query.trim(), settings.language));
    } catch {
      setFound([]);
    } finally {
      setSearching(false);
    }
  };

  const times = useMemo(
    () => (coords ? timesFor(coords, prefs, now) : null),
    [coords, prefs, now],
  );

  const locale = settings.language === 'bn' ? 'bn-BD' : 'en-US';
  const fmt = (d: Date) => formatTime(d, locale, timeZone);

  // adhan's nextPrayer() is 'none' after Isha; roll over to tomorrow's Fajr.
  let nextKey: Row | null = null;
  let nextAt: Date | null = null;
  if (times && coords) {
    const n = times.nextPrayer(now);
    if (n !== 'none') {
      nextKey = n as Row;
      nextAt = times.timeForPrayer(n);
    } else {
      nextKey = 'fajr';
      nextAt = timesFor(coords, prefs, new Date(now.getTime() + 86400000)).fajr;
    }
  }
  const mins = nextAt
    ? Math.max(0, Math.round((nextAt.getTime() - now.getTime()) / 60000))
    : 0;
  const countdown =
    mins >= 60 ? `${Math.floor(mins / 60)}:${pad(mins % 60)}` : `0:${pad(mins)}`;

  // Keep scheduled reminders in step with place, method and the bell settings.
  const alarmsKey = ROWS.map(r => prefs.alarms[r]).join();
  useEffect(() => {
    if (!coords) {
      return;
    }
    const anyOn = ROWS.some(r => prefs.alarms[r] !== 'off');
    rescheduleReminders(coords, prefs, {
      names: {
        fajr: s.fajr,
        sunrise: s.sunrise,
        dhuhr: s.dhuhr,
        asr: s.asr,
        maghrib: s.maghrib,
        isha: s.isha,
      },
      body: s.reminderBody,
      channelVibrate: `${s.reminders}: ${s.alarm_vibrate}`,
      channelSound: `${s.reminders}: ${s.alarm_sound}`,
      locale,
      timeZone,
    })
      .then(() => reminderAccess())
      .then(ok => setNeedAccess(anyOn && !ok))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, prefs.method, prefs.hanafi, alarmsKey, settings.language, timeZone]);

  const cycleAlarm = async (r: Row) => {
    const next = NEXT_MODE[prefs.alarms[r]];
    if (next !== 'off' && !(await reminderAccess())) {
      await requestReminderAccess();
    }
    updatePrefs({alarms: {...prefs.alarms, [r]: next}});
  };

  const chip = (label: string, on: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityState={{selected: on}}
      onPress={onPress}
      style={[
        styles.chip,
        {borderColor: on ? theme.primary : theme.border},
        on && {backgroundColor: theme.primary},
      ]}>
      <Text style={[styles.chipText, {color: on ? theme.onPrimary : theme.text}]}>
        {label}
      </Text>
    </Pressable>
  );

  const placeLabel = manual
    ? manual.name
    : place ??
      (coords
        ? `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`
        : '');

  return (
    <Screen title={s.title} onRefresh={locate} refreshing={busy}>
      {busy && !coords && (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
          <Text style={{color: theme.textMuted}}>{s.locating}</Text>
        </View>
      )}

      {error && !manual && (
        <View
          style={[
            styles.card,
            {backgroundColor: theme.surface, borderColor: theme.border},
          ]}>
          <Text style={[styles.body, {color: theme.text}]}>
            {error === 'denied' ? s.denied : s.failed}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={locate}
            style={[styles.btn, {backgroundColor: theme.primary}]}>
            <Text style={[styles.btnText, {color: theme.onPrimary}]}>
              {s.locate}
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={s.changeLocation}
        onPress={() => setPicker(true)}
        style={[
          styles.placeBar,
          {backgroundColor: theme.surface, borderColor: theme.border},
        ]}>
        <View style={styles.flex}>
          <Text numberOfLines={1} style={[styles.placeName, {color: theme.text}]}>
            📍 {placeLabel || s.changeLocation}
          </Text>
          {manual && (
            <Text style={[styles.small, {color: theme.textMuted}]}>
              {s.manualBadge}
            </Text>
          )}
          {!manual && fromCache && !busy && coords && (
            <Text style={[styles.small, {color: theme.textMuted}]}>
              {s.lastKnown}
            </Text>
          )}
        </View>
        <Text style={[styles.btnText, {color: theme.primary}]}>
          {s.changeLocation}
        </Text>
      </Pressable>

      {times && nextKey && nextAt && (
        <View style={[styles.hero, {backgroundColor: theme.primary}]}>
          <Text style={[styles.heroKicker, {color: theme.onPrimary}]}>
            {s.next}
          </Text>
          <Text style={[styles.heroName, {color: theme.onPrimary}]}>
            {s[nextKey]} · {fmt(nextAt)}
          </Text>
          <Text style={[styles.heroIn, {color: theme.onPrimary}]}>
            {s.in} {countdown}
          </Text>
        </View>
      )}

      {needAccess && (
        <Pressable
          accessibilityRole="button"
          onPress={() => requestReminderAccess().then(ok => setNeedAccess(!ok))}
          style={[
            styles.card,
            {backgroundColor: theme.surface, borderColor: theme.primary},
          ]}>
          <Text style={[styles.body, {color: theme.text}]}>
            {s.alarmPermission}
          </Text>
          <Text style={[styles.btnText, {color: theme.primary}]}>
            {s.openSettings}
          </Text>
        </Pressable>
      )}

      {times &&
        ROWS.map(k => {
          const isNext = k === nextKey;
          const mode = prefs.alarms[k];
          return (
            <View
              key={k}
              style={[
                styles.row,
                {
                  backgroundColor: theme.surface,
                  borderColor: isNext ? theme.primary : theme.border,
                  borderWidth: isNext ? 2 : StyleSheet.hairlineWidth,
                },
              ]}>
              <Text style={[styles.rowName, {color: theme.text}]}>{s[k]}</Text>
              <Text style={[styles.rowTime, {color: theme.text}]}>
                {fmt(times[k])}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${s[k]}: ${s[`alarm_${mode}` as const]}`}
                onPress={() => cycleAlarm(k)}
                style={[
                  styles.bell,
                  {borderColor: mode === 'off' ? theme.border : theme.primary},
                ]}>
                <Text style={styles.bellIcon}>{MODE_ICON[mode]}</Text>
              </Pressable>
            </View>
          );
        })}

      {times && (
        <>
          <Text style={[styles.note, {color: theme.textMuted}]}>
            {s.remindersHint}
          </Text>
          <Text style={[styles.label, {color: theme.textMuted}]}>{s.method}</Text>
          <View style={styles.wrap}>
            {(Object.keys(METHODS) as MethodKey[]).map(k =>
              chip(s[`m_${k}` as const], prefs.method === k, () =>
                updatePrefs({method: k}),
              ),
            )}
          </View>
          <Text style={[styles.label, {color: theme.textMuted}]}>
            {s.asrMethod}
          </Text>
          <View style={styles.wrap}>
            {chip(s.hanafi, prefs.hanafi, () => updatePrefs({hanafi: true}))}
            {chip(s.shafi, !prefs.hanafi, () => updatePrefs({hanafi: false}))}
          </View>
          <Text style={[styles.note, {color: theme.textMuted}]}>{s.calc}</Text>
        </>
      )}

      <Modal
        visible={picker}
        animationType="slide"
        onRequestClose={() => setPicker(false)}>
        <View
          style={[
            styles.modal,
            {backgroundColor: theme.background, paddingTop: insets.top + 12},
          ]}>
          <View style={styles.modalHead}>
            <Text style={[styles.modalTitle, {color: theme.text}]}>
              {s.changeLocation}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => setPicker(false)}>
              <Text style={[styles.btnText, {color: theme.primary}]}>
                {s.close}
              </Text>
            </Pressable>
          </View>
          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={runSearch}
              placeholder={s.search}
              placeholderTextColor={theme.textMuted}
              returnKeyType="search"
              autoFocus
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
            />
            <Pressable
              accessibilityRole="button"
              onPress={runSearch}
              style={[styles.searchBtn, {backgroundColor: theme.primary}]}>
              <Text style={[styles.searchIcon, {color: theme.onPrimary}]}>⌕</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => pickPlace(null)}
            style={[styles.result, {borderColor: theme.border}]}>
            <Text style={[styles.resultText, {color: theme.primary}]}>
              ⌖ {s.useDevice}
            </Text>
          </Pressable>

          {searching && <ActivityIndicator color={theme.primary} />}
          {found && found.length === 0 && !searching && (
            <Text style={[styles.note, {color: theme.textMuted}]}>
              {s.noResults}
            </Text>
          )}
          {(found || []).map(f => (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              onPress={() => pickPlace(f)}
              style={[styles.result, {borderColor: theme.border}]}>
              <Text style={[styles.resultText, {color: theme.text}]}>
                {f.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, gap: 2},
  small: {fontSize: 12},
  center: {alignItems: 'center', gap: 12, marginTop: 40},
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    marginBottom: 16,
  },
  body: {fontSize: 16, lineHeight: 26},
  placeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    minHeight: 60,
  },
  placeName: {fontSize: 17, fontWeight: '600'},
  hero: {padding: 20, borderRadius: 18, gap: 4, marginBottom: 16},
  heroKicker: {fontSize: 14},
  heroName: {fontSize: 26, fontWeight: '700', lineHeight: 38},
  heroIn: {fontSize: 16},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingRight: 10,
    borderRadius: 14,
    marginBottom: 8,
    minHeight: 64,
    gap: 8,
  },
  rowName: {fontSize: 18, fontWeight: '600', flex: 1},
  rowTime: {fontSize: 20, fontWeight: '700', textAlign: 'right'},
  bell: {
    flexShrink: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {fontSize: 22},
  note: {fontSize: 13, lineHeight: 20, marginTop: 8},
  label: {fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 8},
  wrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipText: {fontSize: 14, fontWeight: '600'},
  btn: {
    minHeight: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnText: {fontSize: 15, fontWeight: '700'},
  modal: {flex: 1, paddingHorizontal: 16, gap: 12},
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {fontSize: 22, fontWeight: '700'},
  searchRow: {flexDirection: 'row', gap: 8},
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {fontSize: 18},
  result: {
    minHeight: 52,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultText: {fontSize: 17, lineHeight: 26},
});
