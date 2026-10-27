export type ThemeName = 'light' | 'sepia' | 'dark';

export type Theme = {
  name: ThemeName;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  border: string;
  statusBar: 'dark-content' | 'light-content';
};

export const themes: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    background: '#FFFFFF',
    surface: '#F3F5F4',
    text: '#1B1F1D',
    textMuted: '#555F5A',
    primary: '#0F6B4F',
    onPrimary: '#FFFFFF',
    border: '#D5DBD8',
    statusBar: 'dark-content',
  },
  sepia: {
    name: 'sepia',
    background: '#F4ECD8',
    surface: '#EADFC2',
    text: '#3B2F1E',
    textMuted: '#6A5A42',
    primary: '#7A4E1D',
    onPrimary: '#FFFFFF',
    border: '#D2C3A0',
    statusBar: 'dark-content',
  },
  dark: {
    name: 'dark',
    background: '#000000',
    surface: '#161A18',
    text: '#E8ECEA',
    textMuted: '#A3ACA8',
    primary: '#4FC79C',
    onPrimary: '#00150E',
    border: '#2A302D',
    statusBar: 'light-content',
  },
};
