import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function makeGuestName() {
  return `Guest ${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, salt: string) {
  return await sha256(`${salt}:${password}`);
}

async function createGuestUser(db: any, now: number) {
  const userId = await db.insert("users", {
    fullName: makeGuestName(),
    role: "citizen",
    currentRole: "citizen",
    status: "active",
    onboardingComplete: false,
    createdAt: now,
    updatedAt: now,
  });
  await ensureProfile(db, userId, now);
  return userId;
}

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

async function getPasswordCredentialByEmail(db: any, emailLower: string) {
  const credentials = await db
    .query("passwordCredentials")
    .withIndex("by_emailLower", (q: any) => q.eq("emailLower", emailLower))
    .collect();

  return credentials.sort((a: any, b: any) => b.updatedAt - a.updatedAt)[0] ?? null;
}

async function getPasswordCredentialsByUserId(db: any, userId: any) {
  const credentials = await db
    .query("passwordCredentials")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect();

  return credentials.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
}

async function deleteDuplicateCredentials(
  db: any,
  credentials: any[],
  keepId: any,
) {
  for (const credential of credentials) {
    if (String(credential._id) !== String(keepId)) {
      await db.delete(credential._id);
    }
  }
}

async function upsertPasswordCredential(
  db: any,
  userId: any,
  emailLower: string,
  password: string,
  now: number,
) {
  const existingByEmail = await db
    .query("passwordCredentials")
    .withIndex("by_emailLower", (q: any) => q.eq("emailLower", emailLower))
    .collect();
  const existingForUser = await getPasswordCredentialsByUserId(db, userId);
  const merged = [...existingByEmail, ...existingForUser];
  const deduped = Array.from(
    new Map(merged.map((credential: any) => [String(credential._id), credential])).values(),
  ).sort((a: any, b: any) => b.updatedAt - a.updatedAt);

  const passwordSalt = crypto.randomUUID();
  const passwordHash = await hashPassword(password, passwordSalt);

  if (deduped.length > 0) {
    const primary = deduped[0];
    await db.patch(primary._id, {
      userId,
      emailLower,
      passwordHash,
      passwordSalt,
      updatedAt: now,
    });
    await deleteDuplicateCredentials(db, deduped, primary._id);
    return await db.get(primary._id);
  }

  const credentialId = await db.insert("passwordCredentials", {
    userId,
    emailLower,
    passwordHash,
    passwordSalt,
    createdAt: now,
    updatedAt: now,
  });
  return await db.get(credentialId);
}

async function cleanUpCredentialsForUser(db: any, userId: any) {
  const credentials = await getPasswordCredentialsByUserId(db, userId);
  if (credentials.length <= 1) {
    return credentials[0] ?? null;
  }

  const primary = credentials[0];
  await deleteDuplicateCredentials(db, credentials, primary._id);
  return primary;
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

async function getUserBySessionToken(db: any, sessionToken: string) {
  const session = await getSession(db, sessionToken);
  if (!session) {
    throw new Error("Session not found. Bootstrap the app session first.");
  }
  const user = await db.get(session.userId);
  if (!user) {
    throw new Error("Session user not found.");
  }
  return { session, user };
}

async function buildViewer(db: any, sessionToken: string) {
  const session = await getSession(db, sessionToken);
  if (!session) {
    return null;
  }

  const [user, profile, responderProfile, credential] = await Promise.all([
    db.get(session.userId),
    getProfileByUserId(db, session.userId),
    getResponderProfileByUserId(db, session.userId),
    cleanUpCredentialsForUser(db, session.userId),
  ]);

  if (!user) {
    return null;
  }

  const currentRole =
    user.currentRole ?? (user.role === "responder" ? "responder" : "citizen");

  return {
    session,
    user,
    profile,
    responderProfile,
    currentRole,
    accountRole: user.role,
    isAuthenticated: Boolean(credential),
  };
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

    const userId = await createGuestUser(ctx.db, now);
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
    return await buildViewer(ctx.db, args.sessionToken);
  },
});

export const signUp = mutation({
  args: {
    sessionToken: v.string(),
    fullName: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("citizen"), v.literal("responder")),
  },
  handler: async (ctx, args) => {
    const { user } = await getUserBySessionToken(ctx.db, args.sessionToken);
    const now = Date.now();
    const emailLower = normalizeEmail(args.email);

    if (!emailLower.includes("@")) {
      throw new Error("Enter a valid email address.");
    }
    if (args.password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    const existingCredential = await getPasswordCredentialByEmail(ctx.db, emailLower);
    if (existingCredential && String(existingCredential.userId) !== String(user._id)) {
      throw new Error("An account with this email already exists.");
    }

    await ctx.db.patch(user._id, {
      fullName: args.fullName.trim() || "LifeLine User",
      email: args.email.trim(),
      role: args.role,
      currentRole: args.role,
      onboardingComplete: true,
      updatedAt: now,
    });

    await upsertPasswordCredential(ctx.db, user._id, emailLower, args.password, now);

    if (args.role === "responder") {
      await ensureResponderProfile(ctx.db, user._id, now);
    }

    return await buildViewer(ctx.db, args.sessionToken);
  },
});

export const signIn = mutation({
  args: {
    sessionToken: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await getSession(ctx.db, args.sessionToken);
    if (!session) {
      throw new Error("Session not found. Restart the app and try again.");
    }

    const emailLower = normalizeEmail(args.email);
    const credential = await getPasswordCredentialByEmail(ctx.db, emailLower);
    if (!credential) {
      throw new Error("No account exists for this email.");
    }

    const passwordHash = await hashPassword(args.password, credential.passwordSalt);
    if (passwordHash !== credential.passwordHash) {
      throw new Error("Incorrect email or password.");
    }

    const signedInUser: any = await ctx.db.get(credential.userId);
    if (!signedInUser || signedInUser.status !== "active") {
      throw new Error("This account is unavailable.");
    }

    await ctx.db.patch(session._id, {
      userId: credential.userId,
      lastSeenAt: Date.now(),
    });

    return await buildViewer(ctx.db, args.sessionToken);
  },
});

export const setCurrentRole = mutation({
  args: {
    sessionToken: v.string(),
    currentRole: v.union(v.literal("citizen"), v.literal("responder")),
  },
  handler: async (ctx, args) => {
    const { user } = await getUserBySessionToken(ctx.db, args.sessionToken);
    const allowedRoles =
      user.role === "dual"
        ? ["citizen", "responder"]
        : [user.role === "responder" ? "responder" : "citizen"];

    if (!allowedRoles.includes(args.currentRole)) {
      throw new Error("This account cannot switch to that role.");
    }

    await ctx.db.patch(user._id, {
      currentRole: args.currentRole,
      updatedAt: Date.now(),
    });

    return await buildViewer(ctx.db, args.sessionToken);
  },
});
