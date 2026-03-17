import { v } from "convex/values";
import { api } from "./_generated/api";
import { mutation } from "./_generated/server";

const DEMO_PATIENT_EMAIL = "demo.patient@firstline.demo";
const DEMO_RESPONDER_EMAIL = "demo.responder@firstline.demo";
const DEMO_PASSWORD = "demo1234";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

async function getUserByEmail(db: any, email: string) {
  return await db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .unique();
}

async function ensureCredential(db: any, userId: any, email: string, password: string, now: number) {
  const emailLower = normalizeEmail(email);
  const existing = await db
    .query("passwordCredentials")
    .withIndex("by_emailLower", (q: any) => q.eq("emailLower", emailLower))
    .collect();

  const existingForUser = await db
    .query("passwordCredentials")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect();
  const merged = Array.from(
    new Map(
      [...existing, ...existingForUser].map((credential: any) => [
        String(credential._id),
        credential,
      ]),
    ).values(),
  ).sort((a: any, b: any) => b.updatedAt - a.updatedAt);

  if (merged.length > 0) {
    const primary = merged[0];
    await db.patch(primary._id, { userId, emailLower, updatedAt: now });
    for (const duplicate of merged.slice(1)) {
      await db.delete(duplicate._id);
    }
    return primary._id;
  }

  const passwordSalt = crypto.randomUUID();
  const passwordHash = await hashPassword(password, passwordSalt);
  return await db.insert("passwordCredentials", {
    userId,
    emailLower,
    passwordHash,
    passwordSalt,
    createdAt: now,
    updatedAt: now,
  });
}

async function ensureProfile(db: any, userId: any, now: number) {
  const existing = await db
    .query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  if (existing) {
    return existing;
  }

  const profileId = await db.insert("profiles", {
    userId,
    age: "72",
    bloodGroup: "O+",
    allergiesText: "Penicillin",
    conditionsText: "Hypertension",
    medicationsText: "Amlodipine",
    shareMedicalOnEmergency: true,
    shareLiveLocationOnEmergency: true,
    createdAt: now,
    updatedAt: now,
  });

  return await db.get(profileId);
}

async function ensureResponderProfile(db: any, userId: any, now: number, verified = false) {
  const existing = await db
    .query("responderProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  if (existing) {
      await db.patch(existing._id, {
        verificationStatus: verified ? "verified" : existing.verificationStatus,
        verifiedAt: verified ? now : existing.verifiedAt,
        verifiedBy: verified ? "debug-module" : existing.verifiedBy,
        isAvailable: true,
        preferredTravelMode: existing.preferredTravelMode ?? "walking",
        updatedAt: now,
      });
    return await db.get(existing._id);
  }

  const responderProfileId = await db.insert("responderProfiles", {
    userId,
    verificationStatus: verified ? "verified" : "pending",
    qualificationType: "EMT",
    certificationNumber: "DEBUG-001",
    verifiedAt: verified ? now : undefined,
    verifiedBy: verified ? "debug-module" : undefined,
    skills: ["cpr", "first aid"],
    maxAlertEtaSeconds: 600,
    isAvailable: true,
    preferredTravelMode: "walking",
    createdAt: now,
    updatedAt: now,
  });
  return await db.get(responderProfileId);
}

async function upsertLocation(db: any, userId: any, lat: number, lng: number, source: "foreground" | "incident") {
  const existing = await db
    .query("locations")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  const patch = {
    lat,
    lng,
    source,
    capturedAt: Date.now(),
    accuracyMeters: 5,
  };

  if (existing) {
    await db.patch(existing._id, patch);
    return await db.get(existing._id);
  }

  const locationId = await db.insert("locations", { userId, ...patch });
  return await db.get(locationId);
}

async function ensureDemoContactSet(db: any, userId: any, now: number) {
  const existing = await db
    .query("emergencyContacts")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect();

  if (existing.length > 0) {
    return existing;
  }

  await db.insert("emergencyContacts", {
    userId,
    name: "Anna Demo",
    relationship: "Daughter",
    phone: "+38640111222",
    type: "family",
    priority: 1,
    canReceiveSms: true,
    canReceiveCall: true,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert("emergencyContacts", {
    userId,
    name: "Dr. Kline",
    relationship: "Primary doctor",
    specialty: "Cardiology",
    phone: "+38640111333",
    type: "doctor",
    priority: 2,
    canReceiveSms: true,
    canReceiveCall: true,
    createdAt: now,
    updatedAt: now,
  });
}

async function createDemoUser(db: any, args: { email: string; fullName: string; role: "citizen" | "responder" }, now: number) {
  const existing = await getUserByEmail(db, args.email);
  const userId =
    existing?._id ??
    (await db.insert("users", {
      email: args.email,
      fullName: args.fullName,
      role: args.role,
      currentRole: args.role,
      status: "active",
      onboardingComplete: true,
      createdAt: now,
      updatedAt: now,
    }));

  await db.patch(userId, {
    email: args.email,
    fullName: args.fullName,
    role: args.role,
    currentRole: args.role,
    status: "active",
    onboardingComplete: true,
    updatedAt: now,
  });

  await ensureCredential(db, userId, args.email, DEMO_PASSWORD, now);
  await ensureProfile(db, userId, now);

  if (args.role === "responder") {
    await ensureResponderProfile(db, userId, now, true);
  }

  return await db.get(userId);
}

export const seedDemoUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const patient = await createDemoUser(
      ctx.db,
      { email: DEMO_PATIENT_EMAIL, fullName: "Eleanor Demo", role: "citizen" },
      now,
    );
    const responder = await createDemoUser(
      ctx.db,
      { email: DEMO_RESPONDER_EMAIL, fullName: "Marco Response", role: "responder" },
      now,
    );

    await ensureDemoContactSet(ctx.db, patient!._id, now);
    await upsertLocation(ctx.db, patient!._id, 46.0569, 14.5058, "foreground");
    await upsertLocation(ctx.db, responder!._id, 46.0587, 14.5122, "foreground");

    return {
      patientEmail: DEMO_PATIENT_EMAIL,
      responderEmail: DEMO_RESPONDER_EMAIL,
      password: DEMO_PASSWORD,
    };
  },
});

export const verifyResponder = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserByEmail(ctx.db, args.email.trim());
    if (!user) {
      throw new Error("Responder not found.");
    }

    return await ensureResponderProfile(ctx.db, user._id, Date.now(), true);
  },
});

export const setResponderLocation = mutation({
  args: {
    email: v.string(),
    lat: v.number(),
    lng: v.number(),
    isAvailable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getUserByEmail(ctx.db, args.email.trim());
    if (!user) {
      throw new Error("Responder not found.");
    }

    const responderProfile = await ensureResponderProfile(ctx.db, user._id, Date.now(), true);
    if (typeof args.isAvailable === "boolean") {
      await ctx.db.patch(responderProfile!._id, {
        isAvailable: args.isAvailable,
        updatedAt: Date.now(),
      });
    }

    return await upsertLocation(ctx.db, user._id, args.lat, args.lng, "foreground");
  },
});

export const createFakeWearableIncident = mutation({
  args: {
    patientEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getUserByEmail(
      ctx.db,
      args.patientEmail?.trim() || DEMO_PATIENT_EMAIL,
    );
    if (!patient) {
      throw new Error("Patient not found.");
    }

    const now = Date.now();
    const incidentId = await ctx.db.insert("incidents", {
      createdByUserId: patient._id,
      subjectUserId: patient._id,
      triggerType: "wearable",
      severity: "red",
      status: "searching_responders",
      lat: 46.0569,
      lng: 14.5058,
      addressText: "Debug wearable incident",
      notes: "Created from Convex debug module",
      confirmedAt: now,
      createdAt: now,
    });

    await ctx.db.insert("incidentTimeline", {
      incidentId,
      eventType: "debug_wearable_incident",
      message: "Debug wearable incident created.",
      actorUserId: patient._id,
      createdAt: now,
    });

    await ctx.db.insert("incidentVitals", {
      incidentId,
      heartRate: 128,
      spo2: 92,
      respirationRate: 28,
      deviceTimestamp: now,
      rawPayload: '{"device":"debug-watch"}',
      createdAt: now,
    });

    await upsertLocation(ctx.db, patient._id, 46.0569, 14.5058, "incident");
    await ctx.scheduler.runAfter(0, api.incidents.dispatchIncidentStage, {
      incidentId,
      stageIndex: 0,
    });

    return await ctx.db.get(incidentId);
  },
});

export const clearDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const demoUsers = await Promise.all([
      getUserByEmail(ctx.db, DEMO_PATIENT_EMAIL),
      getUserByEmail(ctx.db, DEMO_RESPONDER_EMAIL),
    ]);
    const userIds = demoUsers.filter(Boolean).map((user: any) => user._id);

    const tablesWithUserId = [
      "appSessions",
      "profiles",
      "emergencyContacts",
      "responderProfiles",
      "verificationSubmissions",
      "locations",
      "healthConnections",
      "passwordCredentials",
    ] as const;

    for (const userId of userIds) {
      for (const tableName of tablesWithUserId) {
        const rows = await ctx.db
          .query(tableName)
          .filter((q: any) => q.eq(q.field("userId"), userId))
          .collect();
        for (const row of rows) {
          await ctx.db.delete(row._id);
        }
      }
    }

    const incidents = await ctx.db.query("incidents").collect();
    const demoIncidentIds = incidents
      .filter((incident: any) => userIds.some((userId: any) => String(userId) === String(incident.subjectUserId)))
      .map((incident: any) => incident._id);

    const incidentTables = [
      "incidentVitals",
      "incidentEscalations",
      "incidentAlerts",
      "incidentAssignments",
      "incidentTimeline",
    ] as const;

    for (const incidentId of demoIncidentIds) {
      for (const tableName of incidentTables) {
        const rows = await ctx.db
          .query(tableName)
          .filter((q: any) => q.eq(q.field("incidentId"), incidentId))
          .collect();
        for (const row of rows) {
          await ctx.db.delete(row._id);
        }
      }
      await ctx.db.delete(incidentId);
    }

    for (const user of demoUsers) {
      if (user) {
        await ctx.db.delete(user._id);
      }
    }

    return { clearedUsers: userIds.length, clearedIncidents: demoIncidentIds.length };
  },
});
