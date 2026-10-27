# Noor — Quran, Dua & Prayer Times

A React Native (0.78, new architecture) Islamic companion app in **Bangla and English**, with Urdu
translations for the Quran and hadith. Content lives in [Convex](https://convex.dev) and is cached on
the device, so anything you have opened keeps working offline.

- Android package: `com.muntakhab` (do not change: it is live on Google Play)
- Launcher name: **Noor** / **নূর** (`strings.xml`, `values-bn/strings.xml`, iOS `Info.plist`)
- Version: see `android/app/build.gradle` and `config/appConfig.ts`

## Features

The bottom bar has six tabs.

### Home

- **Next-prayer card** with the prayer name and time, a progress bar from the previous to the next
  prayer, time remaining, place, and today's Hijri and Gregorian date.
- Today's six prayer times, with the next one highlighted.
- Quick links to Library, Dua, Salat and Tools. Pull down to refresh.

### Library (Read | Listen)

- **Read**
  - **Books:** the _Muntakhab Ahadis_ PDF reader with page memory and text-to-speech (Bangla).
  - **Hadith:** Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah, Muwatta Malik and Nawawi's
    Forty (36,295 hadith), browsed book → section → hadith.
  - **Quran:** all 114 surahs, 6,236 ayahs in Arabic (Hafs Uthmani) with Bangla, English and Urdu
    translations. Per-ayah **reciter audio** that continues through the surah and follows along on
    screen, with six reciters (Alafasy, As-Sudais, Maher Al-Muaiqly, Husary, Abdul Basit, Ash-Shuraim).
- **Listen:** YouTube and Spotify playlists with an in-app player, managed from Convex.
- Hadith and Quran text can be shown in any mix of Bangla, Urdu and English.

### Salat

- Prayer times calculated on the device with [`adhan`](https://github.com/batoulapps/adhan-js)
  (Karachi, MWL, Egyptian, Umm al-Qura, ISNA; Hanafi or Shafi Asr). Bangladesh defaults.
- GPS location or a searched city (Open-Meteo geocoding), with the place name shown.
- Per-prayer **reminders**: off, vibrate or alarm sound, scheduled with Notifee and exact alarms.

### Dua

- 128 duas in 28 categories (morning, evening, wudu, prayer, sleep, food, travel, hajj, protection…),
  with search.
- Arabic, transliteration, translation, **source** line and repeat count. 15 are curated in Bangla and
  English; the rest come from [UmmahAPI](https://ummahapi.com) (English text).
- A **Play** button on duas that have a recording (currently the two Quranic ones).

### Tools

| Tool             | What it does                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Tasbih           | Bead-string counter with dhikr presets, targets (33/99/100/free), vibration, saved count |
| Hijri calendar   | Today's Hijri date, month view, key occasions, ±2 day moon-sighting adjustment           |
| 99 Names         | Asma ul Husna in Arabic, transliteration and Bangla/English meanings                     |
| Zakat calculator | Cash, gold, silver, goods, receivables and debts against the silver or gold nisab        |
| Qibla            | Bearing and distance to the Kaaba with a live magnetometer compass                       |

### Settings

Language (Bangla/English), theme (light, sepia, dark), speech speed, and an FAQ.

### Everywhere

- **Copy, WhatsApp and Share** buttons under every hadith, dua and ayah. The shared text matches what
  is on screen and ends with the app name.
- **Pull-to-refresh** on Home, Library, Salat, Dua, 99 Names and Qibla.
- Custom vector icon set and splash screen (`scripts/make-icons.py`).

## Architecture

```
App.tsx                 tab navigator + theme
src/screens/            Home, LibraryHub (Library + Listen), Salat, Dua, Tools (+ tools/), Settings
src/components/         readers (Pdf, Hadith, Quran), players, Icon, ShareBar, Screen, LangToggle
src/content/            Convex-backed hooks: remote.ts (fetch + file cache), hadithIndex, quran, duas, names
src/salat/              prayer times, reminders, the next-prayer window
src/tools/              zakat, qibla, hijri calculations (pure, no UI)
src/audio/              useAudioQueue: streams a list of MP3s one after another
src/i18n/               bn.json / en.json
convex/                 schema.ts, content.ts (public queries), books.ts, playlists.ts
scripts/                data build/import, icon generation, book upload
```

**Data flow.** `src/content/remote.ts` reads a cached JSON file first, then refreshes from Convex and
rewrites the cache. Files are stored under the app's document directory (AsyncStorage's ~6 MB Android
limit is too small for hadith sections). The only content bundled in the app is the Muntakhab PDF
(offline fallback) and `assets/content/playlists.json`.

**Convex tables:** `hadithBooks`, `hadith`, `surahs`, `ayahs`, `duas`, `names`, `quotes`, `books`,
`playlists`.

## Getting started

Prerequisites: Node 18+, JDK 17, the Android SDK, and Xcode + CocoaPods for iOS. See React Native's
[environment guide](https://reactnative.dev/docs/set-up-your-environment).

```sh
npm install --legacy-peer-deps
npm start                    # Metro
npm run android              # in another terminal
```

iOS:

```sh
bundle install               # first time only
cd ios && bundle exec pod install && cd ..
npm run ios
```

> **Native modules.** After adding or updating a native package (`react-native-svg`,
> `react-native-video`, `@react-native-clipboard/clipboard`, `react-native-sensors`, …) you must
> rebuild the app. A Metro reload is not enough: the app opens to a white screen with
> `TurboModuleRegistry … could not be found` in the log.

## Content and Convex

`config/convex.ts` holds the deployment URL. Current data is on the **dev** deployment.

```sh
npx convex dev --once                         # push schema + functions
python3 scripts/build-seed.py                 # build JSONL from content-source/
scripts/import-seed.sh                        # load every table (or: scripts/import-seed.sh duas)
scripts/upload-book.sh <slug> "<title>" book.pdf [text.json] ["English title"]   # a PDF book
```

Raw downloads (`content-source/hadith-api`, `content-source/quran-api`) are git-ignored. To use a
production deployment: `npx convex deploy`, import with `CONVEX_FLAGS=--prod scripts/import-seed.sh`,
and point `config/convex.ts` at the production URL before building a release.

Sources: hadith and Quran text from [fawazahmed0's APIs](https://github.com/fawazahmed0), duas from
UmmahAPI, 99 Names from the Aladhan API (Bangla meanings written for this app), Quran audio from the
[Al Quran Cloud](https://alquran.cloud) CDN. Review translations with a scholar before release.

## Branding and icons

```sh
python3 scripts/make-icons.py
```

Draws the logo as a transparent vector and writes the splash glyph, adaptive-icon foreground, legacy
launcher PNGs and the 512 px Play Store icon (`android/app/src/main/res/playstore-icon.png`).

## Release build (Android)

Signing is read from `credentials/keystore.properties` (git-ignored); keep the keystore backed up.

1. Raise `versionCode` and `versionName` in `android/app/build.gradle` and `version` in
   `config/appConfig.ts`. Play rejects an upload whose `versionCode` is not higher.
2. Build:

```sh
cd android
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a   # APK
./gradlew bundleRelease                                                       # AAB for Play
```

Output: `android/app/build/outputs/apk/release/app-release.apk`.

Notes:

- A release build needs several GB of free disk. `./gradlew clean` clears old build output.
- A debug build on an emulator can fail with `INSTALL_FAILED_INSUFFICIENT_STORAGE`; uninstall the old
  copy or add `--active-arch-only`.
- Play store title (30 chars max): _Noor: Quran, Dua, Prayer Times_.

## Scripts

| Command                           | Purpose          |
| --------------------------------- | ---------------- |
| `npm start`                       | Metro dev server |
| `npm run android` / `npm run ios` | Build and run    |
| `npm run lint`                    | ESLint           |
| `npx tsc --noEmit`                | Type-check       |
| `npm test`                        | Jest             |

## Known limitations

- Only duas with a recording have a Play button; recordings can be added per dua through the
  `audioUrls` field in Convex.
- Imported duas are English only; with the app in Bangla their title, meaning and source show in English.
- Tabular Hijri dates can differ by a day from local moon sighting (use the adjustment).
- Compass heading uses the magnetometer without declination correction; hold the phone flat.
- Hadith and Quran sections need internet the first time they are opened.
