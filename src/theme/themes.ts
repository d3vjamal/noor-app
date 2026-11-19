export type ThemeName = 'light' | 'sepia' | 'dark' | 'ocean' | 'rose' | 'royal' | 'forest' | 'midnight';

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
  ocean: {
    name: 'ocean',
    background: '#F2F8FB',
    surface: '#E3EFF5',
    text: '#12232B',
    textMuted: '#4F6670',
    primary: '#0B6E99',
    onPrimary: '#FFFFFF',
    border: '#C9DDE6',
    statusBar: 'dark-content',
  },
  rose: {
    name: 'rose',
    background: '#FFF7F8',
    surface: '#FBE9ED',
    text: '#2B1519',
    textMuted: '#6E4E55',
    primary: '#B0305A',
    onPrimary: '#FFFFFF',
    border: '#EBCDD5',
    statusBar: 'dark-content',
  },
  royal: {
    name: 'royal',
    background: '#F8F5FD',
    surface: '#EEE8F9',
    text: '#1E1530',
    textMuted: '#5F5473',
    primary: '#5B3FA8',
    onPrimary: '#FFFFFF',
    border: '#D9CFEE',
    statusBar: 'dark-content',
  },
  forest: {
    name: 'forest',
    background: '#07130D',
    surface: '#10241A',
    text: '#E3F1E8',
    textMuted: '#9DB7A8',
    primary: '#5FD08F',
    onPrimary: '#04150C',
    border: '#1E3A2B',
    statusBar: 'light-content',
  },
  midnight: {
    name: 'midnight',
    background: '#0A1020',
    surface: '#131C33',
    text: '#E6EBF7',
    textMuted: '#9AA6C4',
    primary: '#7FA6FF',
    onPrimary: '#07102A',
    border: '#232F52',
    statusBar: 'light-content',
  },
};
