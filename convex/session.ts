import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function getSession(db: any, sessionToken: string) {
  return await db
    .query("appSessions")
    .withIndex("by_sessionToken", (q: any) => q.eq("sessionToken", sessionToken))
    .unique();
}

async function getProfileByUserId(db: any, userId: any) {
  return await db
    .query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
}

async function getResponderProfileByUserId(db: any, userId: any) {
  return await db
    .query("responderProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
}

async function ensureProfile(db: any, userId: any, now: number) {
  const profile = await getProfileByUserId(db, userId);
  if (profile) {
    return profile;
  }

  const profileId = await db.insert("profiles", {
    userId,
    age: "",
    bloodGroup: "",
    allergiesText: "",
    conditionsText: "",
    medicationsText: "",
    shareMedicalOnEmergency: true,
    shareLiveLocationOnEmergency: true,
    createdAt: now,
    updatedAt: now,
  });
  return await db.get(profileId);
}

async function ensureResponderProfile(db: any, userId: any, now: number) {
  const existing = await getResponderProfileByUserId(db, userId);
  if (existing) {
    return existing;
  }

  const responderProfileId = await db.insert("responderProfiles", {
    userId,
    verificationStatus: "pending",
    skills: ["cpr"],
    isAvailable: false,
    preferredTravelMode: "walking",
    createdAt: now,
    updatedAt: now,
  });
  return await db.get(responderProfileId);
}

export const bootstrap = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existingSession = await getSession(ctx.db, args.sessionToken);

    if (existingSession) {
      await ctx.db.patch(existingSession._id, { lastSeenAt: now });
      await ensureProfile(ctx.db, existingSession.userId, now);
      const user = await ctx.db.get(existingSession.userId);
      return { sessionId: existingSession._id, userId: existingSession.userId, user };
    }

    const userId = await ctx.db.insert("users", {
      fullName: "FirstLine User",
      role: "citizen",
      status: "active",
      onboardingComplete: false,
      createdAt: now,
      updatedAt: now,
    });

    await ensureProfile(ctx.db, userId, now);

    const sessionId = await ctx.db.insert("appSessions", {
      sessionToken: args.sessionToken,
      userId,
      createdAt: now,
      lastSeenAt: now,
    });

    const user = await ctx.db.get(userId);
    return { sessionId, userId, user };
  },
});

export const getViewer = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSession(ctx.db, args.sessionToken);
    if (!session) {
      return null;
    }

    const [user, profile, responderProfile] = await Promise.all([
      ctx.db.get(session.userId),
      getProfileByUserId(ctx.db, session.userId),
      getResponderProfileByUserId(ctx.db, session.userId),
    ]);

    return {
      session,
      user,
      profile,
      responderProfile,
    };
  },
});

export const updateIdentity = mutation({
  args: {
    sessionToken: v.string(),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("citizen"),
        v.literal("responder"),
        v.literal("dual"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const session = await getSession(ctx.db, args.sessionToken);
    if (!session) {
      throw new Error("Session not found. Bootstrap the app session first.");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error("Session user not found.");
    }

    const nextRole = args.role ?? user.role;
    const now = Date.now();

    await ctx.db.patch(user._id, {
      fullName: args.fullName ?? user.fullName,
      email: args.email ?? user.email,
      role: nextRole,
      onboardingComplete: true,
      updatedAt: now,
    });

    if (nextRole === "responder" || nextRole === "dual") {
      await ensureResponderProfile(ctx.db, user._id, now);
    }

    return await ctx.db.get(user._id);
  },
});
