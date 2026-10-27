import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {APP_NAME} from '../../config/appConfig';
import {Lang, Strings, strings} from '../i18n';
import {Theme, ThemeName, themes} from '../theme/themes';

const STORAGE_KEY = 'settings.v1';

export type SpeechSpeed = 'slow' | 'normal' | 'fast';

export type Settings = {
  language: Lang;
  theme: ThemeName;
  speechSpeed: SpeechSpeed;
};

const defaults: Settings = {language: 'bn', theme: 'light', speechSpeed: 'normal'};

type Ctx = {
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
  t: Strings;
  theme: Theme;
  appName: string;
  ready: boolean;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({children}: {children: React.ReactNode}) {
  const [settings, setState] = useState<Settings>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => raw && setState({...defaults, ...JSON.parse(raw)}))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setState(prev => {
      const next = {...prev, ...patch};
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      settings,
      setSettings,
      t: strings[settings.language],
      theme: themes[settings.theme],
      appName: APP_NAME[settings.language],
      ready,
    }),
    [settings, setSettings, ready],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return ctx;
}
