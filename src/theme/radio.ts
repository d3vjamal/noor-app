import {useMemo} from 'react';
import {useSettings} from '../state/settings';
import {Theme} from './themes';

// Colours of the Listen tab, derived from the app theme so it matches the other screens.
export function radioFor(theme: Theme) {
  return {
    bg: theme.background,
    glass: theme.surface,
    glassBorder: theme.border,
    chip: theme.surface,
    amber: theme.primary,
    amberHi: theme.primary,
    onAccent: theme.onPrimary,
    text: theme.text,
    muted: theme.textMuted,
    track: theme.border,
    disc: theme.border,
    statusBar: theme.statusBar,
  };
}

export type Radio = ReturnType<typeof radioFor>;

export function useRadio(): Radio {
  const {theme} = useSettings();
  return useMemo(() => radioFor(theme), [theme]);
}
