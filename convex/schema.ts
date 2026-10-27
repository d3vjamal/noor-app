import {defineSchema, defineTable} from 'convex/server';
import {v} from 'convex/values';

export default defineSchema({
  playlists: defineTable({
    slug: v.string(),
    title: v.string(),
    titleEn: v.optional(v.string()),
    type: v.union(v.literal('audio'), v.literal('video')),
    provider: v.union(v.literal('youtube'), v.literal('spotify')),
    url: v.string(),
    thumbnail: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
  })
    .index('by_slug', ['slug'])
    .index('by_published_order', ['published', 'order']),

  // PDF books. Upload the PDF (and the optional OCR text JSON for text-to-speech) to
  // Convex file storage, then reference it by storage id, or give a plain URL instead.
  books: defineTable({
    slug: v.string(),
    title: v.string(),
    titleEn: v.optional(v.string()),
    pdfStorageId: v.optional(v.id('_storage')),
    pdfUrl: v.optional(v.string()),
    textStorageId: v.optional(v.id('_storage')),
    textUrl: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
  })
    .index('by_slug', ['slug'])
    .index('by_published_order', ['published', 'order']),

  // Hadith collections: one row per book (with its section list) and one row per hadith.
  hadithBooks: defineTable({
    bookId: v.string(),
    titleBn: v.string(),
    titleEn: v.string(),
    order: v.number(),
    sections: v.array(v.object({id: v.string(), name: v.string(), count: v.number()})),
  }).index('by_order', ['order']),

  hadith: defineTable({
    book: v.string(),
    section: v.string(),
    number: v.number(),
    bn: v.optional(v.string()),
    en: v.optional(v.string()),
    ur: v.optional(v.string()),
  }).index('by_book_section', ['book', 'section', 'number']),

  // Quran: one row per surah and per ayah (Arabic plus Bangla, English and Urdu translations).
  surahs: defineTable({
    number: v.number(),
    nameAr: v.string(),
    nameEn: v.string(),
    meaningEn: v.string(),
    revelation: v.string(),
    ayahCount: v.number(),
  }).index('by_number', ['number']),

  ayahs: defineTable({
    surah: v.number(),
    number: v.number(),
    ar: v.string(),
    bn: v.optional(v.string()),
    en: v.optional(v.string()),
    ur: v.optional(v.string()),
  }).index('by_surah', ['surah', 'number']),

  duas: defineTable({
    slug: v.string(),
    category: v.string(),
    titleBn: v.string(),
    titleEn: v.string(),
    arabic: v.string(),
    meaningBn: v.string(),
    meaningEn: v.string(),
    sourceBn: v.string(),
    sourceEn: v.string(),
    // Reciter recordings played in order; leave empty for a dua without audio.
    audioUrls: v.optional(v.array(v.string())),
    transliteration: v.optional(v.string()),
    repeat: v.optional(v.number()),
    order: v.number(),
  }).index('by_order', ['order']),

  names: defineTable({
    number: v.number(),
    arabic: v.string(),
    translit: v.string(),
    nameBn: v.string(),
    meaningEn: v.string(),
    meaningBn: v.string(),
  }).index('by_number', ['number']),

  quotes: defineTable({
    text: v.string(),
    source: v.optional(v.string()),
    order: v.number(),
  }).index('by_order', ['order']),
});
