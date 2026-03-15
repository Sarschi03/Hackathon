import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function getViewerUser(db: any, sessionToken: string) {
  const session = await db
    .query("appSessions")
    .withIndex("by_sessionToken", (q: any) => q.eq("sessionToken", sessionToken))
    .unique();
  if (!session) {
    throw new Error("Session not found.");
  }
  const user = await db.get(session.userId);
  if (!user) {
    throw new Error("User not found.");
  }
  return user;
}

export const getMyProfile = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerUser(ctx.db, args.sessionToken);
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .unique();
  },
});

export const upsertMyProfile = mutation({
  args: {
    sessionToken: v.string(),
    age: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    allergiesText: v.optional(v.string()),
    conditionsText: v.optional(v.string()),
    medicationsText: v.optional(v.string()),
    shareMedicalOnEmergency: v.boolean(),
    shareLiveLocationOnEmergency: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerUser(ctx.db, args.sessionToken);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .unique();

    const patch = {
      age: args.age ?? "",
      dateOfBirth: args.dateOfBirth ?? "",
      bloodGroup: args.bloodGroup ?? "",
      allergiesText: args.allergiesText ?? "",
      conditionsText: args.conditionsText ?? "",
      medicationsText: args.medicationsText ?? "",
      shareMedicalOnEmergency: args.shareMedicalOnEmergency,
      shareLiveLocationOnEmergency: args.shareLiveLocationOnEmergency,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return await ctx.db.get(existing._id);
    }

    const profileId = await ctx.db.insert("profiles", {
      userId: user._id,
      createdAt: Date.now(),
      ...patch,
    });
    return await ctx.db.get(profileId);
  },
});
