export const ALERT_RESPONSE_TIMEOUT_MS = 5_000;
export const ALERT_STAGE_TIMEOUT_MS = 20_000;
export const INCIDENT_CONFIRMATION_WINDOW_MS = 10_000;
export const LOCATION_FRESHNESS_MS = 15 * 60 * 1000;
export const RESPONDER_PREFILTER_MAX_KM = 5;

export const ETA_STAGES = [
  { index: 0, stage: "eta_3m", maxEtaSeconds: 3 * 60 },
  { index: 1, stage: "eta_6m", maxEtaSeconds: 6 * 60 },
  { index: 2, stage: "eta_10m", maxEtaSeconds: 10 * 60 },
] as const;

export function getEtaStage(stageIndex: number) {
  return ETA_STAGES[stageIndex] ?? null;
}

export function getEtaStageForSeconds(seconds: number) {
  return ETA_STAGES.find((stage) => seconds <= stage.maxEtaSeconds) ?? ETA_STAGES.at(-1) ?? null;
}

export function formatEtaMinutes(seconds?: number | null) {
  if (!seconds || seconds <= 0) {
    return "ETA unavailable";
  }
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min ETA`;
}

export function formatCoordinates(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function formatIncidentStatus(status: string) {
  switch (status) {
    case "pending_confirmation":
      return "Waiting 10s confirmation window";
    case "searching_responders":
      return "Escalating to nearby responders";
    case "responder_assigned":
      return "Responder assigned";
    case "closed":
      return "Closed";
    case "cancelled":
      return "Cancelled";
    case "false_alarm":
      return "False alarm";
    default:
      return status.replaceAll("_", " ");
  }
}

export function formatEtaStage(stage: string) {
  switch (stage) {
    case "eta_3m":
      return "Up to 3 minutes";
    case "eta_6m":
      return "Up to 6 minutes";
    case "eta_10m":
      return "Up to 10 minutes";
    default:
      return stage.replaceAll("_", " ");
  }
}

export function formatAssignmentStatus(status: string) {
  switch (status) {
    case "assigned":
      return "Responder en route";
    case "arrived":
      return "Responder arrived";
    case "completed":
      return "Incident complete";
    case "cancelled":
      return "Assignment cancelled";
    default:
      return status.replaceAll("_", " ");
  }
}

export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6371e3;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

export function fallbackWalkingEtaSeconds(distanceMeters: number) {
  const averageWalkingSpeedMetersPerSecond = 1.4;
  return Math.round(distanceMeters / averageWalkingSpeedMetersPerSecond);
}

export function fallbackDrivingEtaSeconds(distanceMeters: number) {
  const averageDrivingSpeedMetersPerSecond = 11.1;
  return Math.max(60, Math.round(distanceMeters / averageDrivingSpeedMetersPerSecond));
}

export function formatTravelMode(mode: "walking" | "driving") {
  return mode === "driving" ? "Driving" : "Walking";
}

export function makeEmergencySummary(profile: {
  bloodGroup?: string | null;
  allergiesText?: string | null;
  conditionsText?: string | null;
  medicationsText?: string | null;
}) {
  return {
    bloodGroup: profile.bloodGroup ?? null,
    allergies: profile.allergiesText ?? "",
    conditions: profile.conditionsText ?? "",
    medications: profile.medicationsText ?? "",
  };
}
