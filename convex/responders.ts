import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { makeEmergencySummary } from "./lib";

async function getViewer(db: any, sessionToken: string) {
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
  return { session, user };
}

async function getResponderProfile(db: any, userId: any) {
  return await db
    .query("responderProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
}

export const getMyResponderProfile = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await getViewer(ctx.db, args.sessionToken);
    return await getResponderProfile(ctx.db, user._id);
  },
});

export const submitVerification = mutation({
  args: {
    sessionToken: v.string(),
    qualificationType: v.string(),
    certificationNumber: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await getViewer(ctx.db, args.sessionToken);
    const now = Date.now();
    const existing = await getResponderProfile(ctx.db, user._id);

    if (!existing) {
      await ctx.db.insert("responderProfiles", {
        userId: user._id,
        verificationStatus: "pending",
        qualificationType: args.qualificationType,
        certificationNumber: args.certificationNumber,
        skills: ["cpr"],
        isAvailable: false,
        preferredTravelMode: "walking",
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, {
        verificationStatus: "pending",
        qualificationType: args.qualificationType,
        certificationNumber: args.certificationNumber,
        updatedAt: now,
      });
    }

    await ctx.db.insert("verificationSubmissions", {
      userId: user._id,
      qualificationType: args.qualificationType,
      certificationNumber: args.certificationNumber,
      documentUrl: args.documentUrl,
      reviewStatus: "pending",
      reviewNotes: args.notes,
      aiPrecheckSummary: "Pending manual review",
      submittedAt: now,
    });

    return await getResponderProfile(ctx.db, user._id);
  },
});

export const setAvailability = mutation({
  args: {
    sessionToken: v.string(),
    isAvailable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await getViewer(ctx.db, args.sessionToken);
    const responderProfile = await getResponderProfile(ctx.db, user._id);
    if (!responderProfile) {
      throw new Error("Responder profile not found.");
    }
    await ctx.db.patch(responderProfile._id, {
      isAvailable: args.isAvailable,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(responderProfile._id);
  },
});

export const listMyIncomingAlerts = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await getViewer(ctx.db, args.sessionToken);
    const alerts = await ctx.db
      .query("incidentAlerts")
      .withIndex("by_responderUserId", (q: any) => q.eq("responderUserId", user._id))
      .collect();

    const pendingAlerts = alerts
      .filter((alert: any) => alert.responseStatus === "pending")
      .sort((a: any, b: any) => b.sentAt - a.sentAt);

    const enriched = [];
    for (const alert of pendingAlerts) {
      const incident = await ctx.db.get(alert.incidentId);
      if (!incident) {
        continue;
      }
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q: any) => q.eq("userId", incident.subjectUserId))
        .unique();
      enriched.push({
        ...alert,
        incident,
        medicalSummary: profile ? makeEmergencySummary(profile) : null,
      });
    }
    return enriched;
  },
});

export const acceptAlert = mutation({
  args: {
    sessionToken: v.string(),
    alertId: v.id("incidentAlerts"),
  },
  handler: async (ctx, args) => {
    const { user } = await getViewer(ctx.db, args.sessionToken);
    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.responderUserId !== user._id) {
      throw new Error("Alert not found.");
    }

    const incident = await ctx.db.get(alert.incidentId);
    if (!incident) {
      throw new Error("Incident not found.");
    }

    if (incident.activeAssignmentId) {
      throw new Error("Another responder already accepted this incident.");
    }

    const now = Date.now();
    const assignmentId = await ctx.db.insert("incidentAssignments", {
      incidentId: incident._id,
      responderUserId: user._id,
      assignedAt: now,
      etaSeconds: alert.estimatedTravelSeconds,
      status: "assigned",
    });

    await ctx.db.patch(alert._id, {
      responseStatus: "accepted",
      deliveryStatus: "sent",
    });

    const relatedAlerts = await ctx.db
      .query("incidentAlerts")
      .withIndex("by_incidentId", (q: any) => q.eq("incidentId", incident._id))
      .collect();
    for (const related of relatedAlerts) {
      if (related._id !== alert._id && related.responseStatus === "pending") {
        await ctx.db.patch(related._id, { responseStatus: "timed_out" });
      }
    }

    await ctx.db.patch(incident._id, {
      status: "responder_assigned",
      activeAssignmentId: assignmentId,
    });

    await ctx.db.insert("incidentTimeline", {
      incidentId: incident._id,
      eventType: "responder_accepted",
      message: `${user.fullName} accepted the emergency alert.`,
      actorUserId: user._id,
      payload: { alertId: alert._id, assignmentId },
      createdAt: now,
    });

    return {
      incidentId: incident._id,
      assignmentId,
    };
  },
});
