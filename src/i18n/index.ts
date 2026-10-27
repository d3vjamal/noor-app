import bn from './bn.json';
import en from './en.json';

export type Lang = 'bn' | 'en';
export type Strings = typeof bn;

export const strings: Record<Lang, Strings> = {bn, en};
