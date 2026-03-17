import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  formatAssignmentStatus,
  formatCoordinates,
  formatEtaMinutes,
  formatEtaStage,
  makeEmergencySummary,
} from "./lib";

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

async function addTimelineEvent(
  db: any,
  incidentId: any,
  eventType: string,
  message: string,
  actorUserId?: any,
  payload?: any,
) {
  await db.insert("incidentTimeline", {
    incidentId,
    eventType,
    message,
    actorUserId,
    payload,
    createdAt: Date.now(),
  });
}

async function requireResponder(db: any, sessionToken: string) {
  const viewer = await getViewer(db, sessionToken);
  const responderProfile = await getResponderProfile(db, viewer.user._id);
  if (!responderProfile) {
    throw new Error("Responder profile not found.");
  }
  return { ...viewer, responderProfile };
}

async function getIncidentEmergencySummary(db: any, incident: any) {
  const [profile, patient] = await Promise.all([
    db
      .query("profiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", incident.subjectUserId))
      .unique(),
    db.get(incident.subjectUserId),
  ]);

  return {
    patientName: patient?.fullName ?? "Unknown patient",
    medicalSummary: profile ? makeEmergencySummary(profile) : null,
  };
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
    const { responderProfile } = await requireResponder(ctx.db, args.sessionToken);
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
    const { user } = await requireResponder(ctx.db, args.sessionToken);
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

      const emergency = await getIncidentEmergencySummary(ctx.db, incident);
      enriched.push({
        ...alert,
        incident,
        patientName: emergency.patientName,
        medicalSummary: emergency.medicalSummary,
        etaLabel: formatEtaMinutes(alert.estimatedTravelSeconds),
        stageLabel: formatEtaStage(alert.stage),
        incidentLocationLabel: incident.addressText
          ? incident.addressText
          : formatCoordinates(incident.lat, incident.lng),
      });
    }
    return enriched;
  },
});

export const getMyActiveAssignment = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireResponder(ctx.db, args.sessionToken);
    const assignments = await ctx.db
      .query("incidentAssignments")
      .withIndex("by_responderUserId", (q: any) => q.eq("responderUserId", user._id))
      .collect();

    const activeAssignment = assignments
      .filter((assignment: any) => ["assigned", "arrived"].includes(assignment.status))
      .sort((a: any, b: any) => b.assignedAt - a.assignedAt)[0];

    if (!activeAssignment) {
      return null;
    }

    const incident = await ctx.db.get(activeAssignment.incidentId);
    if (!incident) {
      return null;
    }

    const emergency = await getIncidentEmergencySummary(ctx.db, incident);
    return {
      assignment: {
        ...activeAssignment,
        displayStatus: formatAssignmentStatus(activeAssignment.status),
        etaLabel: formatEtaMinutes(activeAssignment.etaSeconds),
      },
      incident,
      patientName: emergency.patientName,
      medicalSummary: emergency.medicalSummary,
      incidentLocationLabel: incident.addressText
        ? incident.addressText
        : formatCoordinates(incident.lat, incident.lng),
    };
  },
});

export const acceptAlert = mutation({
  args: {
    sessionToken: v.string(),
    alertId: v.id("incidentAlerts"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireResponder(ctx.db, args.sessionToken);
    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.responderUserId !== user._id) {
      throw new Error("Alert not found.");
    }
    if (alert.responseStatus !== "pending") {
      throw new Error("This alert is no longer available.");
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
      statusUpdatedAt: now,
    });

    await ctx.db.patch(alert._id, {
      responseStatus: "accepted",
      deliveryStatus: "sent",
      respondedAt: now,
    });

    const relatedAlerts = await ctx.db
      .query("incidentAlerts")
      .withIndex("by_incidentId", (q: any) => q.eq("incidentId", incident._id))
      .collect();
    for (const related of relatedAlerts) {
      if (related._id !== alert._id && related.responseStatus === "pending") {
        await ctx.db.patch(related._id, {
          responseStatus: "timed_out",
          respondedAt: now,
        });
      }
    }

    await ctx.db.patch(incident._id, {
      status: "responder_assigned",
      activeAssignmentId: assignmentId,
    });

    await addTimelineEvent(
      ctx.db,
      incident._id,
      "responder_accepted",
      `${user.fullName} accepted the emergency alert.`,
      user._id,
      { alertId: alert._id, assignmentId },
    );

    return {
      incidentId: incident._id,
      assignmentId,
    };
  },
});

export const declineAlert = mutation({
  args: {
    sessionToken: v.string(),
    alertId: v.id("incidentAlerts"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireResponder(ctx.db, args.sessionToken);
    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.responderUserId !== user._id) {
      throw new Error("Alert not found.");
    }
    if (alert.responseStatus !== "pending") {
      return alert;
    }

    const now = Date.now();
    await ctx.db.patch(alert._id, {
      responseStatus: "declined",
      respondedAt: now,
    });

    await addTimelineEvent(
      ctx.db,
      alert.incidentId,
      "responder_declined",
      `${user.fullName} declined the alert.`,
      user._id,
      { alertId: alert._id },
    );

    return await ctx.db.get(alert._id);
  },
});

export const updateAssignmentStatus = mutation({
  args: {
    sessionToken: v.string(),
    assignmentId: v.id("incidentAssignments"),
    status: v.union(
      v.literal("assigned"),
      v.literal("arrived"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requireResponder(ctx.db, args.sessionToken);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.responderUserId !== user._id) {
      throw new Error("Assignment not found.");
    }

    const incident = await ctx.db.get(assignment.incidentId);
    if (!incident) {
      throw new Error("Incident not found.");
    }

    const now = Date.now();
    const patch: Record<string, any> = {
      status: args.status,
      statusUpdatedAt: now,
    };
    if (args.status === "arrived") {
      patch.arrivalAt = now;
    }
    if (args.status === "completed") {
      patch.completedAt = now;
    }

    await ctx.db.patch(assignment._id, patch);

    if (args.status === "completed" || args.status === "cancelled") {
      await ctx.db.patch(incident._id, {
        status: "closed",
        closedAt: now,
      });
    }

    await addTimelineEvent(
      ctx.db,
      incident._id,
      "assignment_status_updated",
      `${user.fullName} marked the assignment as ${args.status}.`,
      user._id,
      { assignmentId: assignment._id, status: args.status },
    );

    return await ctx.db.get(assignment._id);
  },
});

export const requestBackup = mutation({
  args: {
    sessionToken: v.string(),
    assignmentId: v.id("incidentAssignments"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireResponder(ctx.db, args.sessionToken);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.responderUserId !== user._id) {
      throw new Error("Assignment not found.");
    }

    const now = Date.now();
    await ctx.db.patch(assignment._id, {
      backupRequestedAt: now,
      statusUpdatedAt: now,
    });

    await addTimelineEvent(
      ctx.db,
      assignment.incidentId,
      "backup_requested",
      `${user.fullName} requested backup.`,
      user._id,
      { assignmentId: assignment._id },
    );

    return await ctx.db.get(assignment._id);
  },
});
