import {internalMutation, query} from './_generated/server';
import {v} from 'convex/values';

// Public, read-only: what the app calls. Storage ids are turned into download URLs here.
export const list = query({
  args: {},
  handler: async ctx => {
    const rows = await ctx.db
      .query('books')
      .withIndex('by_published_order', q => q.eq('published', true))
      .collect();
    return await Promise.all(
      rows.map(async b => ({
        slug: b.slug,
        title: b.title,
        titleEn: b.titleEn,
        pdfUrl: b.pdfStorageId ? await ctx.storage.getUrl(b.pdfStorageId) : b.pdfUrl ?? null,
        textUrl: b.textStorageId ? await ctx.storage.getUrl(b.textStorageId) : b.textUrl ?? null,
      })),
    );
  },
});

// Internal only (CLI / dashboard): see scripts/upload-book.sh.
export const generateUploadUrl = internalMutation({
  args: {},
  handler: async ctx => await ctx.storage.generateUploadUrl(),
});

export const upsert = internalMutation({
  args: {
    slug: v.string(),
    title: v.string(),
    titleEn: v.optional(v.string()),
    pdfStorageId: v.optional(v.id('_storage')),
    pdfUrl: v.optional(v.string()),
    textStorageId: v.optional(v.id('_storage')),
    textUrl: v.optional(v.string()),
    order: v.optional(v.number()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('books')
      .withIndex('by_slug', q => q.eq('slug', args.slug))
      .unique();
    const doc = {...args, order: args.order ?? 100, published: args.published ?? true};
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert('books', doc);
  },
});
