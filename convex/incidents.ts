import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
import {
  ALERT_STAGE_TIMEOUT_MS,
  ETA_STAGES,
  INCIDENT_CONFIRMATION_WINDOW_MS,
  LOCATION_FRESHNESS_MS,
  RESPONDER_PREFILTER_MAX_KM,
  fallbackWalkingEtaSeconds,
  getEtaStage,
  haversineDistanceMeters,
  makeEmergencySummary,
} from "./lib";

type ResponderCandidate = {
  userId: any;
  fullName: string;
  lat: number;
  lng: number;
  approxDistanceMeters: number;
  preferredTravelMode: "walking";
};

async function getSession(db: any, sessionToken: string) {
  return await db
    .query("appSessions")
    .withIndex("by_sessionToken", (q: any) => q.eq("sessionToken", sessionToken))
    .unique();
}

async function getViewerUser(db: any, sessionToken: string) {
  const session = await getSession(db, sessionToken);
  if (!session) {
    throw new Error("Session not found.");
  }
  const user = await db.get(session.userId);
  if (!user) {
    throw new Error("User not found.");
  }
  return user;
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

async function getLatestLocation(db: any, userId: any) {
  return await db
    .query("locations")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
}

async function getIncidentProfile(db: any, incident: any) {
  return await db
    .query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", incident.subjectUserId))
    .unique();
}

export const getActiveIncidentForViewer = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerUser(ctx.db, args.sessionToken);
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_subjectUserId", (q: any) => q.eq("subjectUserId", user._id))
      .collect();

    const activeIncident = incidents
      .filter((incident: any) =>
        ["pending_confirmation", "searching_responders", "responder_assigned"].includes(
          incident.status,
        ),
      )
      .sort((a: any, b: any) => b.createdAt - a.createdAt)[0];

    if (!activeIncident) {
      return null;
    }

    const [profile, timeline, assignment] = await Promise.all([
      getIncidentProfile(ctx.db, activeIncident),
      ctx.db
        .query("incidentTimeline")
        .withIndex("by_incidentId", (q: any) => q.eq("incidentId", activeIncident._id))
        .collect(),
      activeIncident.activeAssignmentId
        ? ctx.db.get(activeIncident.activeAssignmentId)
        : null,
    ]);

    return {
      incident: activeIncident,
      medicalSummary: profile ? makeEmergencySummary(profile) : null,
      timeline: timeline.sort((a: any, b: any) => a.createdAt - b.createdAt),
      assignment,
    };
  },
});

export const createIncident = mutation({
  args: {
    sessionToken: v.string(),
    triggerType: v.union(
      v.literal("manual"),
      v.literal("wearable"),
      v.literal("phone_call"),
      v.literal("manual_dispatch"),
    ),
    lat: v.number(),
    lng: v.number(),
    addressText: v.optional(v.string()),
    notes: v.optional(v.string()),
    vitals: v.optional(
      v.object({
        heartRate: v.optional(v.number()),
        spo2: v.optional(v.number()),
        bloodPressureSystolic: v.optional(v.number()),
        bloodPressureDiastolic: v.optional(v.number()),
        respirationRate: v.optional(v.number()),
        rawPayload: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getViewerUser(ctx.db, args.sessionToken);
    const now = Date.now();

    const incidentId = await ctx.db.insert("incidents", {
      createdByUserId: user._id,
      subjectUserId: user._id,
      triggerType: args.triggerType,
      severity: "yellow",
      status: "pending_confirmation",
      lat: args.lat,
      lng: args.lng,
      addressText: args.addressText,
      notes: args.notes,
      confirmationDeadlineAt: now + INCIDENT_CONFIRMATION_WINDOW_MS,
      createdAt: now,
    });

    await addTimelineEvent(
      ctx.db,
      incidentId,
      "incident_created",
      "Emergency incident created and waiting for user confirmation timeout.",
      user._id,
      { triggerType: args.triggerType },
    );

    const location = await getLatestLocation(ctx.db, user._id);
    if (location) {
      await ctx.db.patch(location._id, {
        lat: args.lat,
        lng: args.lng,
        source: "incident",
        capturedAt: now,
      });
    } else {
      await ctx.db.insert("locations", {
        userId: user._id,
        lat: args.lat,
        lng: args.lng,
        source: "incident",
        capturedAt: now,
      });
    }

    if (args.vitals) {
      await ctx.db.insert("incidentVitals", {
        incidentId,
        heartRate: args.vitals.heartRate,
        spo2: args.vitals.spo2,
        bloodPressureSystolic: args.vitals.bloodPressureSystolic,
        bloodPressureDiastolic: args.vitals.bloodPressureDiastolic,
        respirationRate: args.vitals.respirationRate,
        rawPayload: args.vitals.rawPayload,
        deviceTimestamp: now,
        createdAt: now,
      });
    }

    await ctx.scheduler.runAfter(
      INCIDENT_CONFIRMATION_WINDOW_MS,
      api.incidents.evaluateIncidentConfirmation,
      { incidentId },
    );

    return await ctx.db.get(incidentId);
  },
});

export const cancelIncident = mutation({
  args: {
    sessionToken: v.string(),
    incidentId: v.id("incidents"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerUser(ctx.db, args.sessionToken);
    const incident = await ctx.db.get(args.incidentId);
    if (!incident || incident.subjectUserId !== user._id) {
      throw new Error("Incident not found.");
    }

    const nextStatus =
      incident.status === "pending_confirmation" ? "false_alarm" : "cancelled";
    await ctx.db.patch(incident._id, {
      status: nextStatus,
      cancelReason: args.reason ?? "Cancelled by user",
      closedAt: Date.now(),
    });

    await addTimelineEvent(
      ctx.db,
      incident._id,
      "incident_cancelled",
      args.reason ?? "Incident cancelled by the user.",
      user._id,
    );

    return await ctx.db.get(incident._id);
  },
});

export const evaluateIncidentConfirmation = mutation({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident || incident.status !== "pending_confirmation") {
      return incident;
    }

    await ctx.db.patch(incident._id, {
      severity: "red",
      status: "searching_responders",
      confirmedAt: Date.now(),
    });

    await addTimelineEvent(
      ctx.db,
      incident._id,
      "incident_escalated",
      "Confirmation window elapsed. Starting ETA-based responder search.",
      incident.subjectUserId,
    );

    await ctx.scheduler.runAfter(0, api.incidents.dispatchIncidentStage, {
      incidentId: incident._id,
      stageIndex: 0,
    });

    return await ctx.db.get(incident._id);
  },
});
export const getEligibleRespondersForIncident = query({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      return [];
    }

    const now = Date.now();
    const responderProfiles = await ctx.db
      .query("responderProfiles")
      .withIndex("by_verificationStatus", (q: any) =>
        q.eq("verificationStatus", "verified"),
      )
      .collect();

    const priorAlerts = await ctx.db
      .query("incidentAlerts")
      .withIndex("by_incidentId", (q: any) => q.eq("incidentId", incident._id))
      .collect();
    const alertedResponderIds = new Set(
      priorAlerts.map((alert: any) => String(alert.responderUserId)),
    );

    const candidates: ResponderCandidate[] = [];

    for (const responderProfile of responderProfiles) {
      if (!responderProfile.isAvailable) {
        continue;
      }
      if (String(responderProfile.userId) === String(incident.subjectUserId)) {
        continue;
      }
      if (alertedResponderIds.has(String(responderProfile.userId))) {
        continue;
      }

      const location = await getLatestLocation(ctx.db, responderProfile.userId);
      if (!location || now - location.capturedAt > LOCATION_FRESHNESS_MS) {
        continue;
      }

      const approxDistanceMeters = haversineDistanceMeters(
        incident.lat,
        incident.lng,
        location.lat,
        location.lng,
      );
      if (approxDistanceMeters > RESPONDER_PREFILTER_MAX_KM * 1000) {
        continue;
      }

      const user = await ctx.db.get(responderProfile.userId);
      if (!user) {
        continue;
      }

      candidates.push({
        userId: responderProfile.userId,
        fullName: user.fullName,
        lat: location.lat,
        lng: location.lng,
        approxDistanceMeters,
        preferredTravelMode: "walking",
      });
    }

    return candidates.sort(
      (a, b) => a.approxDistanceMeters - b.approxDistanceMeters,
    );
  },
});
export const computeResponderEtasWithGoogle = action({
  args: {
    incidentId: v.id("incidents"),
    maxEtaSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.runQuery(api.incidents.getIncidentLocation, {
      incidentId: args.incidentId,
    });
    const candidates = await ctx.runQuery(
      api.incidents.getEligibleRespondersForIncident,
      {
        incidentId: args.incidentId,
      },
    );

    if (!incident || candidates.length === 0) {
      return [];
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const limitedCandidates = candidates.slice(0, 25);

    if (apiKey) {
      try {
        const origins = limitedCandidates
          .map((candidate: ResponderCandidate) => `${candidate.lat},${candidate.lng}`)
          .join("|");
        const destination = `${incident.lat},${incident.lng}`;
        const url =
          "https://maps.googleapis.com/maps/api/distancematrix/json" +
          `?origins=${encodeURIComponent(origins)}` +
          `&destinations=${encodeURIComponent(destination)}` +
          "&mode=walking" +
          `&key=${encodeURIComponent(apiKey)}`;

        const response = await fetch(url);
        if (response.ok) {
          const payload = await response.json();
          const rows = Array.isArray(payload.rows) ? payload.rows : [];
          const enriched = limitedCandidates
            .map((candidate: ResponderCandidate, index: number) => {
              const element = rows[index]?.elements?.[0];
              const durationSeconds =
                element?.status === "OK" ? element.duration?.value : undefined;
              const estimatedTravelSeconds =
                typeof durationSeconds === "number"
                  ? durationSeconds
                  : fallbackWalkingEtaSeconds(candidate.approxDistanceMeters);
              return {
                ...candidate,
                estimatedTravelSeconds,
                routeProvider:
                  typeof durationSeconds === "number"
                    ? "google_maps"
                    : "fallback_radius",
              };
            })
            .filter((candidate: any) => candidate.estimatedTravelSeconds <= args.maxEtaSeconds)
            .sort(
              (a: any, b: any) =>
                a.estimatedTravelSeconds - b.estimatedTravelSeconds,
            );

          return enriched;
        }
      } catch {
      }
    }
    return limitedCandidates
      .map((candidate: ResponderCandidate) => ({
        ...candidate,
        estimatedTravelSeconds: fallbackWalkingEtaSeconds(
          candidate.approxDistanceMeters,
        ),
        routeProvider: "fallback_radius",
      }))
      .filter((candidate: any) => candidate.estimatedTravelSeconds <= args.maxEtaSeconds)
      .sort((a: any, b: any) => a.estimatedTravelSeconds - b.estimatedTravelSeconds);
  },
});

export const dispatchIncidentStage = action({
  args: {
    incidentId: v.id("incidents"),
    stageIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const stage = getEtaStage(args.stageIndex);
    if (!stage) {
      return { dispatched: 0 };
    }

    const incident = await ctx.runQuery(api.incidents.getIncidentStatus, {
      incidentId: args.incidentId,
    });
    if (
      !incident ||
      !["searching_responders", "responder_assigned"].includes(incident.status)
    ) {
      return { dispatched: 0 };
    }
    if (incident.activeAssignmentId) {
      return { dispatched: 0 };
    }

    const responderEtas = await ctx.runAction(
      api.incidents.computeResponderEtasWithGoogle,
      {
        incidentId: args.incidentId,
        maxEtaSeconds: stage.maxEtaSeconds,
      },
    );

    await ctx.runMutation(api.incidents.recordStageDispatch, {
      incidentId: args.incidentId,
      stageIndex: stage.index,
      stage: stage.stage,
      maxEtaSeconds: stage.maxEtaSeconds,
      responders: responderEtas,
    });

    if (args.stageIndex < ETA_STAGES.length - 1) {
      await ctx.runMutation(api.incidents.scheduleStageAdvance, {
        incidentId: args.incidentId,
        stageIndex: args.stageIndex,
      });
    }

    return { dispatched: responderEtas.length };
  },
});
export const scheduleStageAdvance = mutation({
  args: {
    incidentId: v.id("incidents"),
    stageIndex: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(
      ALERT_STAGE_TIMEOUT_MS,
      api.incidents.advanceIncidentStageIfUnclaimed,
      {
        incidentId: args.incidentId,
        stageIndex: args.stageIndex,
      },
    );
    return true;
  },
});

export const advanceIncidentStageIfUnclaimed = mutation({
  args: {
    incidentId: v.id("incidents"),
    stageIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident || incident.activeAssignmentId) {
      return { advanced: false };
    }
    if (incident.status !== "searching_responders") {
      return { advanced: false };
    }

    const escalation = await ctx.db
      .query("incidentEscalations")
      .withIndex("by_incidentId_stageIndex", (q: any) =>
        q.eq("incidentId", args.incidentId).eq("stageIndex", args.stageIndex),
      )
      .unique();
    if (escalation && !escalation.completedAt) {
      await ctx.db.patch(escalation._id, { completedAt: Date.now() });
    }

    const nextStage = getEtaStage(args.stageIndex + 1);
    if (!nextStage) {
      await addTimelineEvent(
        ctx.db,
        args.incidentId,
        "search_exhausted",
        "No responder accepted within the configured ETA stages.",
      );
      return { advanced: false };
    }

    await addTimelineEvent(
      ctx.db,
      args.incidentId,
      "stage_advanced",
      `Escalating responder search to ${nextStage.maxEtaSeconds / 60} minutes ETA.`,
    );

    await ctx.scheduler.runAfter(0, api.incidents.dispatchIncidentStage, {
      incidentId: args.incidentId,
      stageIndex: nextStage.index,
    });

    return { advanced: true };
  },
});
export const recordStageDispatch = mutation({
  args: {
    incidentId: v.id("incidents"),
    stageIndex: v.number(),
    stage: v.union(
      v.literal("eta_3m"),
      v.literal("eta_6m"),
      v.literal("eta_10m"),
    ),
    maxEtaSeconds: v.number(),
    responders: v.array(
      v.object({
        userId: v.id("users"),
        fullName: v.string(),
        lat: v.number(),
        lng: v.number(),
        approxDistanceMeters: v.number(),
        preferredTravelMode: v.union(v.literal("walking")),
        estimatedTravelSeconds: v.number(),
        routeProvider: v.union(
          v.literal("google_maps"),
          v.literal("fallback_radius"),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident || incident.activeAssignmentId) {
      return [];
    }

    const now = Date.now();
    const escalationId = await ctx.db.insert("incidentEscalations", {
      incidentId: args.incidentId,
      stage: args.stage,
      stageIndex: args.stageIndex,
      maxEtaSeconds: args.maxEtaSeconds,
      routeProvider: args.responders.some(
        (responder) => responder.routeProvider === "google_maps",
      )
        ? "google_maps"
        : "fallback_radius",
      responderCount: args.responders.length,
      startedAt: now,
    });

    const alertIds = [];
    for (const responder of args.responders) {
      const alertId = await ctx.db.insert("incidentAlerts", {
        incidentId: args.incidentId,
        responderUserId: responder.userId,
        stage: args.stage,
        stageIndex: args.stageIndex,
        maxEtaSeconds: args.maxEtaSeconds,
        sentAt: now,
        deliveryStatus: "sent",
        responseStatus: "pending",
        estimatedTravelSeconds: responder.estimatedTravelSeconds,
        travelMode: responder.preferredTravelMode,
        routeProvider: responder.routeProvider,
        selectionReason: "eta_within_stage",
      });
      alertIds.push(alertId);
    }

    await addTimelineEvent(
      ctx.db,
      args.incidentId,
      "stage_dispatched",
      `Alerted ${args.responders.length} responder(s) within ${
        args.maxEtaSeconds / 60
      } minutes ETA.`,
      undefined,
      {
        stage: args.stage,
        escalationId,
        alertIds,
      },
    );

    return alertIds;
  },
});

export const getIncidentStatus = query({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.incidentId);
  },
});

export const getIncidentLocation = query({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      return null;
    }
    return {
      _id: incident._id,
      lat: incident.lat,
      lng: incident.lng,
      status: incident.status,
      activeAssignmentId: incident.activeAssignmentId,
    };
  },
});
