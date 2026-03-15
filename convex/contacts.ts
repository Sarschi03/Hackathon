import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

export const listMyContacts = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getViewerUserId(ctx.db, args.sessionToken);
    return await ctx.db
      .query("emergencyContacts")
      .withIndex("by_userId_priority", (q: any) => q.eq("userId", userId))
      .collect();
  },
});

export const replaceMyContacts = mutation({
  args: {
    sessionToken: v.string(),
    contacts: v.array(
      v.object({
        name: v.string(),
        relationship: v.string(),
        phone: v.string(),
        type: v.union(v.literal("family"), v.literal("doctor")),
        specialty: v.optional(v.string()),
        priority: v.number(),
        canReceiveSms: v.boolean(),
        canReceiveCall: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getViewerUserId(ctx.db, args.sessionToken);
    const existing = await ctx.db
      .query("emergencyContacts")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .collect();

    for (const contact of existing) {
      await ctx.db.delete(contact._id);
    }

    const now = Date.now();
    for (const contact of args.contacts) {
      await ctx.db.insert("emergencyContacts", {
        userId,
        ...contact,
        createdAt: now,
        updatedAt: now,
      });
    }

    return await ctx.db
      .query("emergencyContacts")
      .withIndex("by_userId_priority", (q: any) => q.eq("userId", userId))
      .collect();
  },
});
