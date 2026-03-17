import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
import {
  ALERT_RESPONSE_TIMEOUT_MS,
  INCIDENT_CONFIRMATION_WINDOW_MS,
  LOCATION_FRESHNESS_MS,
  RESPONDER_PREFILTER_MAX_KM,
  fallbackDrivingEtaSeconds,
  fallbackWalkingEtaSeconds,
  formatAssignmentStatus,
  formatCoordinates,
  formatEtaMinutes,
  formatEtaStage,
  formatIncidentStatus,
  getEtaStage,
  getEtaStageForSeconds,
  haversineDistanceMeters,
  makeEmergencySummary,
} from "./lib";

type ResponderCandidate = {
  userId: any;
  fullName: string;
  lat: number;
  lng: number;
  approxDistanceMeters: number;
  preferredTravelMode: "walking" | "driving";
  maxAlertEtaSeconds?: number;
};

type ResponderEtaCandidate = ResponderCandidate & {
  estimatedTravelSeconds: number;
  routeProvider: "google_maps" | "fallback_radius";
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

async function getLatestEscalation(db: any, incidentId: any) {
  const escalations = await db
    .query("incidentEscalations")
    .withIndex("by_incidentId", (q: any) => q.eq("incidentId", incidentId))
    .collect();
  return escalations.sort((a: any, b: any) => b.startedAt - a.startedAt)[0] ?? null;
}

function getFallbackEtaSeconds(
  distanceMeters: number,
  preferredTravelMode: "walking" | "driving",
) {
  return preferredTravelMode === "driving"
    ? fallbackDrivingEtaSeconds(distanceMeters)
    : fallbackWalkingEtaSeconds(distanceMeters);
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

    const [profile, timeline, assignment, escalation] = await Promise.all([
      getIncidentProfile(ctx.db, activeIncident),
      ctx.db
        .query("incidentTimeline")
        .withIndex("by_incidentId", (q: any) => q.eq("incidentId", activeIncident._id))
        .collect(),
      activeIncident.activeAssignmentId
        ? ctx.db.get(activeIncident.activeAssignmentId)
        : null,
      getLatestEscalation(ctx.db, activeIncident._id),
    ]);
    const assignedResponder = assignment
      ? await ctx.db.get(assignment.responderUserId)
      : null;

    return {
      incident: activeIncident,
      displayStatus: formatIncidentStatus(activeIncident.status),
      escalationLabel: escalation ? formatEtaStage(escalation.stage) : null,
      incidentLocationLabel: activeIncident.addressText
        ? activeIncident.addressText
        : formatCoordinates(activeIncident.lat, activeIncident.lng),
      medicalSummary: profile ? makeEmergencySummary(profile) : null,
      timeline: timeline.sort((a: any, b: any) => a.createdAt - b.createdAt),
      assignment: assignment
        ? {
            ...assignment,
            displayStatus: formatAssignmentStatus(assignment.status),
            etaLabel: formatEtaMinutes(assignment.etaSeconds),
            responderName: assignedResponder?.fullName ?? "Assigned responder",
          }
        : null,
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
      "Confirmation window elapsed. Starting ETA-ranked responder search.",
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
        preferredTravelMode: responderProfile.preferredTravelMode ?? "walking",
        maxAlertEtaSeconds: responderProfile.maxAlertEtaSeconds,
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
  },
  handler: async (ctx, args): Promise<ResponderEtaCandidate[]> => {
    const incident = await ctx.runQuery(api.incidents.getIncidentLocation, {
      incidentId: args.incidentId,
    });
    const candidates: ResponderCandidate[] = await ctx.runQuery(
      api.incidents.getEligibleRespondersForIncident,
      {
        incidentId: args.incidentId,
      },
    );

    if (!incident || candidates.length === 0) {
      return [];
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const limitedCandidates = candidates.slice(0, 50);
    const destination = `${incident.lat},${incident.lng}`;

    async function enrichCandidatesForMode(
      preferredTravelMode: "walking" | "driving",
      modeCandidates: ResponderCandidate[],
    ): Promise<ResponderEtaCandidate[]> {
      const fallback = modeCandidates.map((candidate) => ({
        ...candidate,
        estimatedTravelSeconds: getFallbackEtaSeconds(
          candidate.approxDistanceMeters,
          preferredTravelMode,
        ),
        routeProvider: "fallback_radius" as const,
      }));

      if (!apiKey || modeCandidates.length === 0) {
        return fallback;
      }

      try {
        const enriched: ResponderEtaCandidate[] = [];
        for (let index = 0; index < modeCandidates.length; index += 25) {
          const chunk = modeCandidates.slice(index, index + 25);
          const origins = chunk
            .map((candidate) => `${candidate.lat},${candidate.lng}`)
            .join("|");
          const url =
            "https://maps.googleapis.com/maps/api/distancematrix/json" +
            `?origins=${encodeURIComponent(origins)}` +
            `&destinations=${encodeURIComponent(destination)}` +
            `&mode=${encodeURIComponent(preferredTravelMode)}` +
            `&key=${encodeURIComponent(apiKey)}`;

          const response = await fetch(url);
          if (!response.ok) {
            enriched.push(...fallback.slice(index, index + chunk.length));
            continue;
          }

          const payload = await response.json();
          const rows = Array.isArray(payload.rows) ? payload.rows : [];
          enriched.push(
            ...chunk.map((candidate, rowIndex) => {
              const element = rows[rowIndex]?.elements?.[0];
              const durationSeconds =
                element?.status === "OK" ? element.duration?.value : undefined;
              return {
                ...candidate,
                estimatedTravelSeconds:
                  typeof durationSeconds === "number"
                    ? durationSeconds
                    : getFallbackEtaSeconds(
                        candidate.approxDistanceMeters,
                        preferredTravelMode,
                      ),
                routeProvider:
                  typeof durationSeconds === "number"
                    ? ("google_maps" as const)
                    : ("fallback_radius" as const),
              };
            }),
          );
        }
        return enriched;
      } catch {
        return fallback;
      }
    }

    const [walkingEtas, drivingEtas] = await Promise.all([
      enrichCandidatesForMode(
        "walking",
        limitedCandidates.filter((candidate) => candidate.preferredTravelMode === "walking"),
      ),
      enrichCandidatesForMode(
        "driving",
        limitedCandidates.filter((candidate) => candidate.preferredTravelMode === "driving"),
      ),
    ]);

    return [...walkingEtas, ...drivingEtas]
      .filter(
        (candidate) =>
          !candidate.maxAlertEtaSeconds ||
          candidate.estimatedTravelSeconds <= candidate.maxAlertEtaSeconds,
      )
      .sort((a, b) => a.estimatedTravelSeconds - b.estimatedTravelSeconds);
  },
});

export const dispatchIncidentStage = action({
  args: {
    incidentId: v.id("incidents"),
    stageIndex: v.number(),
  },
  handler: async (ctx, args): Promise<{ dispatched: number }> => {
    const incident = await ctx.runQuery(api.incidents.getIncidentStatus, {
      incidentId: args.incidentId,
    });
    if (!incident || incident.status !== "searching_responders" || incident.activeAssignmentId) {
      return { dispatched: 0 };
    }

    const responderEtas = await ctx.runAction(api.incidents.computeResponderEtasWithGoogle, {
      incidentId: args.incidentId,
    });

    const nextResponder = responderEtas[0];
    if (!nextResponder) {
      await ctx.runMutation(api.incidents.markSearchExhausted, {
        incidentId: args.incidentId,
      });
      return { dispatched: 0 };
    }

    await ctx.runMutation(api.incidents.recordSequentialDispatch, {
      incidentId: args.incidentId,
      queueLength: responderEtas.length,
      responder: nextResponder,
    });

    return { dispatched: 1 };
  },
});

export const markSearchExhausted = mutation({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident || incident.activeAssignmentId || incident.status !== "searching_responders") {
      return false;
    }

    const timeline = await ctx.db
      .query("incidentTimeline")
      .withIndex("by_incidentId", (q: any) => q.eq("incidentId", args.incidentId))
      .collect();
    if (timeline.some((event: any) => event.eventType === "search_exhausted")) {
      return false;
    }

    await addTimelineEvent(
      ctx.db,
      args.incidentId,
      "search_exhausted",
      "All nearby responders were tried in fastest-first order and none accepted.",
    );
    return true;
  },
});

export const timeoutResponderAlert = mutation({
  args: {
    incidentId: v.id("incidents"),
    alertId: v.id("incidentAlerts"),
  },
  handler: async (ctx, args) => {
    const [incident, alert] = await Promise.all([
      ctx.db.get(args.incidentId),
      ctx.db.get(args.alertId),
    ]);
    if (!incident || !alert) {
      return { timedOut: false };
    }
    if (incident.status !== "searching_responders" || incident.activeAssignmentId) {
      return { timedOut: false };
    }
    if (alert.responseStatus !== "pending") {
      return { timedOut: false };
    }

    const now = Date.now();
    await ctx.db.patch(alert._id, {
      responseStatus: "timed_out",
      respondedAt: now,
    });

    await addTimelineEvent(
      ctx.db,
      incident._id,
      "responder_timeout",
      "No responder reply within 5 seconds, notifying the next fastest responder.",
      undefined,
      { alertId: alert._id, responderUserId: alert.responderUserId },
    );

    await ctx.scheduler.runAfter(0, api.incidents.dispatchIncidentStage, {
      incidentId: incident._id,
      stageIndex: 0,
    });

    return { timedOut: true };
  },
});

export const recordSequentialDispatch = mutation({
  args: {
    incidentId: v.id("incidents"),
    queueLength: v.number(),
    responder: v.object({
      userId: v.id("users"),
      fullName: v.string(),
      lat: v.number(),
      lng: v.number(),
      approxDistanceMeters: v.number(),
      preferredTravelMode: v.union(v.literal("walking"), v.literal("driving")),
      estimatedTravelSeconds: v.number(),
      routeProvider: v.union(
        v.literal("google_maps"),
        v.literal("fallback_radius"),
      ),
      maxAlertEtaSeconds: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident || incident.status !== "searching_responders" || incident.activeAssignmentId) {
      return null;
    }

    const existingAlerts = await ctx.db
      .query("incidentAlerts")
      .withIndex("by_incidentId", (q: any) => q.eq("incidentId", args.incidentId))
      .collect();
    if (existingAlerts.some((alert: any) => alert.responseStatus === "pending")) {
      return null;
    }

    const stage = getEtaStageForSeconds(args.responder.estimatedTravelSeconds) ?? getEtaStage(0);
    if (!stage) {
      return null;
    }

    const now = Date.now();
    const escalationId = await ctx.db.insert("incidentEscalations", {
      incidentId: args.incidentId,
      stage: stage.stage,
      stageIndex: stage.index,
      maxEtaSeconds: stage.maxEtaSeconds,
      routeProvider: args.responder.routeProvider,
      responderCount: args.queueLength,
      startedAt: now,
    });

    const alertId = await ctx.db.insert("incidentAlerts", {
      incidentId: args.incidentId,
      responderUserId: args.responder.userId,
      stage: stage.stage,
      stageIndex: stage.index,
      maxEtaSeconds: stage.maxEtaSeconds,
      sentAt: now,
      deliveryStatus: "sent",
      responseStatus: "pending",
      respondedAt: undefined,
      estimatedTravelSeconds: args.responder.estimatedTravelSeconds,
      travelMode: args.responder.preferredTravelMode,
      routeProvider: args.responder.routeProvider,
      selectionReason: "fastest_eta_first",
    });

    await addTimelineEvent(
      ctx.db,
      args.incidentId,
      "responder_notified",
      `Notified ${args.responder.fullName} based on the fastest ${
        args.responder.preferredTravelMode
      } route.`,
      undefined,
      {
        alertId,
        escalationId,
        responderUserId: args.responder.userId,
        queueLength: args.queueLength,
      },
    );

    await ctx.scheduler.runAfter(
      ALERT_RESPONSE_TIMEOUT_MS,
      api.incidents.timeoutResponderAlert,
      {
        incidentId: args.incidentId,
        alertId,
      },
    );

    return alertId;
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
