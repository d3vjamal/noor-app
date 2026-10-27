import {query} from './_generated/server';
import {v} from 'convex/values';

// Public, read-only queries the app calls. Data is loaded with scripts/import-seed.sh.

export const hadithBooks = query({
  args: {},
  handler: async ctx => ctx.db.query('hadithBooks').withIndex('by_order').collect(),
});

export const hadithSection = query({
  args: {book: v.string(), section: v.string()},
  handler: async (ctx, {book, section}) =>
    ctx.db
      .query('hadith')
      .withIndex('by_book_section', q => q.eq('book', book).eq('section', section))
      .collect(),
});

export const surahs = query({
  args: {},
  handler: async ctx => ctx.db.query('surahs').withIndex('by_number').collect(),
});

export const ayahs = query({
  args: {surah: v.number()},
  handler: async (ctx, {surah}) =>
    ctx.db.query('ayahs').withIndex('by_surah', q => q.eq('surah', surah)).collect(),
});

export const duas = query({
  args: {},
  handler: async ctx => ctx.db.query('duas').withIndex('by_order').collect(),
});

export const names = query({
  args: {},
  handler: async ctx => ctx.db.query('names').withIndex('by_number').collect(),
});

export const quotes = query({
  args: {},
  handler: async ctx => ctx.db.query('quotes').withIndex('by_order').collect(),
});
