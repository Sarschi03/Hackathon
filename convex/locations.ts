import { v } from "convex/values";
import { mutation } from "./_generated/server";

async function getViewerUserId(db: any, sessionToken: string) {
  const session = await db
    .query("appSessions")
    .withIndex("by_sessionToken", (q: any) => q.eq("sessionToken", sessionToken))
    .unique();
  if (!session) {
    throw new Error("Session not found.");
  }
  return session.userId;
}

export const updateMyLocation = mutation({
  args: {
    sessionToken: v.string(),
    lat: v.number(),
    lng: v.number(),
    accuracyMeters: v.optional(v.number()),
    source: v.union(
      v.literal("foreground"),
      v.literal("background"),
      v.literal("incident"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getViewerUserId(ctx.db, args.sessionToken);
    const existing = await ctx.db
      .query("locations")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();

    const patch = {
      lat: args.lat,
      lng: args.lng,
      accuracyMeters: args.accuracyMeters,
      capturedAt: Date.now(),
      source: args.source,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return await ctx.db.get(existing._id);
    }

    const locationId = await ctx.db.insert("locations", {
      userId,
      ...patch,
    });
    return await ctx.db.get(locationId);
  },
});
