import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  appSessions: defineTable({
    sessionToken: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    lastSeenAt: v.number(),
  }).index("by_sessionToken", ["sessionToken"]),

  users: defineTable({
    externalIdentity: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    fullName: v.string(),
    role: v.union(
      v.literal("citizen"),
      v.literal("responder"),
      v.literal("dual"),
    ),
    status: v.union(v.literal("active"), v.literal("disabled")),
    onboardingComplete: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  profiles: defineTable({
    userId: v.id("users"),
    age: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    allergiesText: v.optional(v.string()),
    conditionsText: v.optional(v.string()),
    medicationsText: v.optional(v.string()),
    shareMedicalOnEmergency: v.boolean(),
    shareLiveLocationOnEmergency: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  emergencyContacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    relationship: v.string(),
    phone: v.string(),
    type: v.union(v.literal("family"), v.literal("doctor")),
    specialty: v.optional(v.string()),
    priority: v.number(),
    canReceiveSms: v.boolean(),
    canReceiveCall: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_priority", ["userId", "priority"]),

  responderProfiles: defineTable({
    userId: v.id("users"),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected"),
    ),
    qualificationType: v.optional(v.string()),
    certificationNumber: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.string()),
    skills: v.array(v.string()),
    maxAlertEtaSeconds: v.optional(v.number()),
    isAvailable: v.boolean(),
    preferredTravelMode: v.union(v.literal("walking")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_verificationStatus", ["verificationStatus"]),

  verificationSubmissions: defineTable({
    userId: v.id("users"),
    qualificationType: v.string(),
    certificationNumber: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
    reviewStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    reviewNotes: v.optional(v.string()),
    aiPrecheckSummary: v.optional(v.string()),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  locations: defineTable({
    userId: v.id("users"),
    lat: v.number(),
    lng: v.number(),
    accuracyMeters: v.optional(v.number()),
    capturedAt: v.number(),
    source: v.union(
      v.literal("foreground"),
      v.literal("background"),
      v.literal("incident"),
    ),
  }).index("by_userId", ["userId"]),

  healthConnections: defineTable({
    userId: v.id("users"),
    provider: v.union(
      v.literal("apple_health"),
      v.literal("health_connect"),
      v.literal("watch"),
      v.literal("manual_device"),
    ),
    status: v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("pending"),
    ),
    signalTypesEnabled: v.array(v.string()),
    lastSyncAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  incidents: defineTable({
    createdByUserId: v.id("users"),
    subjectUserId: v.id("users"),
    triggerType: v.union(
      v.literal("manual"),
      v.literal("wearable"),
      v.literal("phone_call"),
      v.literal("manual_dispatch"),
    ),
    severity: v.union(v.literal("yellow"), v.literal("red")),
    status: v.union(
      v.literal("pending_confirmation"),
      v.literal("searching_responders"),
      v.literal("responder_assigned"),
      v.literal("closed"),
      v.literal("cancelled"),
      v.literal("false_alarm"),
    ),
    lat: v.number(),
    lng: v.number(),
    addressText: v.optional(v.string()),
    notes: v.optional(v.string()),
    confirmationDeadlineAt: v.optional(v.number()),
    confirmedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    cancelReason: v.optional(v.string()),
    activeAssignmentId: v.optional(v.id("incidentAssignments")),
    createdAt: v.number(),
  })
    .index("by_subjectUserId", ["subjectUserId"])
    .index("by_status", ["status"]),

  incidentVitals: defineTable({
    incidentId: v.id("incidents"),
    heartRate: v.optional(v.number()),
    spo2: v.optional(v.number()),
    bloodPressureSystolic: v.optional(v.number()),
    bloodPressureDiastolic: v.optional(v.number()),
    respirationRate: v.optional(v.number()),
    deviceTimestamp: v.optional(v.number()),
    rawPayload: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_incidentId", ["incidentId"]),

  incidentEscalations: defineTable({
    incidentId: v.id("incidents"),
    stage: v.union(
      v.literal("eta_3m"),
      v.literal("eta_6m"),
      v.literal("eta_10m"),
    ),
    stageIndex: v.number(),
    maxEtaSeconds: v.number(),
    routeProvider: v.union(
      v.literal("google_maps"),
      v.literal("fallback_radius"),
    ),
    responderCount: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_incidentId", ["incidentId"])
    .index("by_incidentId_stageIndex", ["incidentId", "stageIndex"]),

  incidentAlerts: defineTable({
    incidentId: v.id("incidents"),
    responderUserId: v.id("users"),
    stage: v.union(
      v.literal("eta_3m"),
      v.literal("eta_6m"),
      v.literal("eta_10m"),
    ),
    stageIndex: v.number(),
    maxEtaSeconds: v.number(),
    sentAt: v.number(),
    deliveryStatus: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("failed"),
    ),
    responseStatus: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("timed_out"),
    ),
    estimatedTravelSeconds: v.number(),
    travelMode: v.union(v.literal("walking")),
    routeProvider: v.union(
      v.literal("google_maps"),
      v.literal("fallback_radius"),
    ),
    selectionReason: v.string(),
  })
    .index("by_incidentId", ["incidentId"])
    .index("by_responderUserId", ["responderUserId"])
    .index("by_incidentId_responderUserId", ["incidentId", "responderUserId"]),

  incidentAssignments: defineTable({
    incidentId: v.id("incidents"),
    responderUserId: v.id("users"),
    assignedAt: v.number(),
    etaSeconds: v.optional(v.number()),
    arrivalAt: v.optional(v.number()),
    status: v.union(
      v.literal("assigned"),
      v.literal("arrived"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  })
    .index("by_incidentId", ["incidentId"])
    .index("by_responderUserId", ["responderUserId"]),

  incidentTimeline: defineTable({
    incidentId: v.id("incidents"),
    eventType: v.string(),
    message: v.string(),
    actorUserId: v.optional(v.id("users")),
    payload: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_incidentId", ["incidentId"]),
});
