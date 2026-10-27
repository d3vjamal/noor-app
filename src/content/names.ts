import {useRemote} from './remote';

export type Name = {
  number: number;
  arabic: string;
  translit: string;
  nameBn: string;
  meaningEn: string;
  meaningBn: string;
};

export function useNames() {
  return useRemote<Name[]>('names', 'content:names');
}

export type Quote = {text: string; source?: string};

export function useQuotes() {
  return useRemote<Quote[]>('quotes', 'content:quotes');
}
