import {internalMutation, query} from './_generated/server';
import {v} from 'convex/values';

// Public, read-only: what the app calls.
export const list = query({
  args: {},
  handler: async ctx => {
    return await ctx.db
      .query('playlists')
      .withIndex('by_published_order', q => q.eq('published', true))
      .collect();
  },
});

// Write access is internal only: run from the Convex dashboard or CLI, e.g.
//   npx convex run playlists:upsert '{"slug":"pl-002", ...}'
// You can also edit rows directly in the dashboard's Data tab.
export const upsert = internalMutation({
  args: {
    slug: v.string(),
    title: v.string(),
    titleEn: v.optional(v.string()),
    type: v.union(v.literal('audio'), v.literal('video')),
    provider: v.union(v.literal('youtube'), v.literal('spotify')),
    url: v.string(),
    thumbnail: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('playlists')
      .withIndex('by_slug', q => q.eq('slug', args.slug))
      .unique();
    const doc = {...args, order: args.order ?? 100, published: args.published ?? true};
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert('playlists', doc);
  },
});
