import * as Location from "expo-location";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "@/convex/_generated/api";
import { ActiveIncidentCard } from "@/components/home/active-incident-card";
import { EmergencyGuidanceCard } from "@/components/home/emergency-guidance-card";
import { PatientHomeState } from "@/components/home/patient-home-state";
import { ResponderAlertList } from "@/components/home/responder-alert-list";
import { ResponderAvailabilityCard } from "@/components/home/responder-availability-card";
import { ResponderVerificationCard } from "@/components/home/responder-verification-card";
import { useAppSession } from "@/hooks/use-app-session";
import { useDemoVitals } from "@/hooks/use-demo-vitals";
import { useHealthConnect } from "@/hooks/use-health-connect";

import { useLocalization } from "@/hooks/use-localization";

const FALLBACK_LOCATION = {
  latitude: 46.0569,
  longitude: 14.5058,
};

async function getCurrentCoordinates() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    return FALLBACK_LOCATION;
  }

  const position = await Location.getCurrentPositionAsync({});
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? undefined,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { sessionToken, isReady, viewer, currentRole, isAuthenticated } = useAppSession();
  const { heartRate, bloodOxygen, isAvailable: isHealthAvailable } = useHealthConnect();
  const vitals = useDemoVitals({
    baselineHeartRate: heartRate,
    baselineBloodOxygen: bloodOxygen,
  });

  const activeIncident = useQuery(
    api.incidents.getActiveIncidentForViewer,
    sessionToken && currentRole === "citizen" ? { sessionToken } : "skip",
  );
  const responderProfile = useQuery(
    api.responders.getMyResponderProfile,
    sessionToken && currentRole === "responder" ? { sessionToken } : "skip",
  );
  const verificationState = useQuery(
    api.responders.getMyVerificationState,
    sessionToken && currentRole === "responder" ? { sessionToken } : "skip",
  );
  const incomingAlerts = useQuery(
    api.responders.listMyIncomingAlerts,
    sessionToken && currentRole === "responder" ? { sessionToken } : "skip",
  );
  const activeAssignment = useQuery(
    api.responders.getMyActiveAssignment,
    sessionToken && currentRole === "responder" ? { sessionToken } : "skip",
  );

  const createIncident = useMutation(api.incidents.createIncident);
  const cancelIncident = useMutation(api.incidents.cancelIncident);
  const updateMyLocation = useMutation(api.locations.updateMyLocation);
  const setAvailability = useMutation(api.responders.setAvailability);
  const setPreferredTravelMode = useMutation(api.responders.setPreferredTravelMode);
  const setMaxAlertEtaSeconds = useMutation(api.responders.setMaxAlertEtaSeconds);
  const submitVerification = useMutation(api.responders.submitVerification);
  const approveMyResponderForDemo = useMutation(api.responders.approveMyResponderForDemo);
  const acceptAlert = useMutation(api.responders.acceptAlert);
  const declineAlert = useMutation(api.responders.declineAlert);
  const updateAssignmentStatus = useMutation(api.responders.updateAssignmentStatus);
  const requestBackup = useMutation(api.responders.requestBackup);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTriggeringWearable, setIsTriggeringWearable] = useState(false);
  const viewerUser = (viewer as any)?.user;

  const firstName = useMemo(() => {
    const fullName = viewerUser?.fullName ?? "Friend";
    return fullName.split(" ")[0];
  }, [viewerUser?.fullName]);

  useEffect(() => {
    if (!sessionToken || currentRole !== "responder") {
      return;
    }
    const currentSessionToken = sessionToken;

    async function refreshResponderLocation() {
      try {
        const coords = await getCurrentCoordinates();
        await updateMyLocation({
          sessionToken: currentSessionToken,
          lat: coords.latitude,
          lng: coords.longitude,
          accuracyMeters: "accuracy" in coords ? coords.accuracy : undefined,
          source: "foreground",
        });
      } catch {
      }
    }

    void refreshResponderLocation();
  }, [currentRole, sessionToken, updateMyLocation]);

  async function updateViewerLocation(source: "foreground" | "incident") {
    if (!sessionToken) {
      return null;
    }
    const coords = await getCurrentCoordinates();
    await updateMyLocation({
      sessionToken,
      lat: coords.latitude,
      lng: coords.longitude,
      accuracyMeters: "accuracy" in coords ? coords.accuracy : undefined,
      source,
    });
    return coords;
  }

  const handleSosPress = async () => {
    if (!sessionToken) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeIncident?.incident) {
        await cancelIncident({
          sessionToken,
          incidentId: activeIncident.incident._id,
          reason: "Cancelled from patient home",
        });
      } else {
        const coords = await updateViewerLocation("incident");
        if (!coords) {
          return;
        }
        await createIncident({
          sessionToken,
          triggerType: "manual",
          lat: coords.latitude,
          lng: coords.longitude,
          addressText: "Live device location",
          notes: "Triggered from patient SOS",
        });
      }
    } catch (error) {
      Alert.alert(
        "Emergency action failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWearableTrigger = async () => {
    if (!sessionToken || activeIncident?.incident) {
      return;
    }

    setIsTriggeringWearable(true);
    try {
      const coords = await updateViewerLocation("incident");
      if (!coords) {
        return;
      }
      await createIncident({
        sessionToken,
        triggerType: "wearable",
        lat: coords.latitude,
        lng: coords.longitude,
        addressText: "Automatic wearable alert",
        notes: "Simulated irregular heart rhythm detected from wearable stream.",
        vitals: {
          heartRate: vitals.heartRate,
          spo2: vitals.bloodOxygen,
          bloodPressureSystolic: vitals.systolic,
          bloodPressureDiastolic: vitals.diastolic,
          respirationRate: vitals.respiratoryRate,
          rawPayload: JSON.stringify({
            source: isHealthAvailable ? "health-connect" : "demo-feed",
            statusLabel: vitals.statusLabel,
          }),
        },
      });
    } catch (error) {
      Alert.alert(
        "Wearable escalation failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsTriggeringWearable(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!sessionToken || !responderProfile) {
      return;
    }
    try {
      await updateViewerLocation("foreground");
      await setAvailability({
        sessionToken,
        isAvailable: !responderProfile.isAvailable,
      });
    } catch (error) {
      Alert.alert(
        "Responder status failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleTravelModeChange = async (preferredTravelMode: "walking" | "driving") => {
    if (!sessionToken || !responderProfile) {
      return;
    }
    try {
      await setPreferredTravelMode({
        sessionToken,
        preferredTravelMode,
      });
    } catch (error) {
      Alert.alert(
        "Travel mode update failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleCoverageChange = async (maxAlertEtaSeconds: number) => {
    if (!sessionToken || !responderProfile) {
      return;
    }
    try {
      await setMaxAlertEtaSeconds({
        sessionToken,
        maxAlertEtaSeconds,
      });
    } catch (error) {
      Alert.alert(
        "Coverage update failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleSubmitVerification = async (input: {
    qualificationType: string;
    certificationNumber?: string;
    notes?: string;
  }) => {
    if (!sessionToken) {
      return;
    }
    try {
      await submitVerification({
        sessionToken,
        qualificationType: input.qualificationType,
        certificationNumber: input.certificationNumber,
        notes: input.notes,
      });
      Alert.alert("Verification submitted", "Your responder credentials were saved for review.");
    } catch (error) {
      Alert.alert(
        "Verification failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleApproveDemo = async () => {
    if (!sessionToken) {
      return;
    }
    try {
      await approveMyResponderForDemo({ sessionToken });
      Alert.alert("Demo responder approved", "This account can now receive incident alerts.");
    } catch (error) {
      Alert.alert(
        "Demo approval failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleAlertAction = async (action: "accept" | "decline", alertId: string) => {
    if (!sessionToken) {
      return;
    }
    try {
      if (action === "accept") {
        await acceptAlert({ sessionToken, alertId: alertId as never });
      } else {
        await declineAlert({ sessionToken, alertId: alertId as never });
      }
    } catch (error) {
      Alert.alert(
        "Responder action failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleAssignmentAction = async (
    action: "backup" | "arrived" | "complete",
    assignmentId: string,
  ) => {
    if (!sessionToken) {
      return;
    }

    try {
      if (action === "backup") {
        await requestBackup({ sessionToken, assignmentId: assignmentId as never });
        Alert.alert(
          "Backup requested",
          "A backup request was added to the incident timeline for the demo.",
        );
        return;
      }

      await updateAssignmentStatus({
        sessionToken,
        assignmentId: assignmentId as never,
        status: action === "arrived" ? "arrived" : "completed",
      });
    } catch (error) {
      Alert.alert(
        "Assignment update failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  if (!isReady || !viewer) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.authCard}>
          <Text style={styles.authEyebrow}>LifeLine demo</Text>
          <Text style={styles.authTitle}>{t('home_emergency_help')}</Text>
          <Text style={styles.authBody}>
            Use a patient account for the SOS side or a responder account for dispatch.
          </Text>
          <Text style={styles.authLink} onPress={() => router.push("/login")}>
            {t('login_title')}
          </Text>
          <Text style={styles.authLink} onPress={() => router.push("/signup")}>
            {t('signup_title')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {currentRole === "responder" ? (
          <>
            <ResponderAvailabilityCard
              responderProfile={responderProfile}
              onToggleAvailability={() => void handleToggleAvailability()}
              onSelectTravelMode={(mode) => void handleTravelModeChange(mode)}
              onSelectCoverage={(coverage) => void handleCoverageChange(coverage)}
            />
            <ResponderVerificationCard
              verificationState={verificationState}
              onSubmitVerification={handleSubmitVerification}
              onApproveDemo={handleApproveDemo}
            />
            <ResponderAlertList
              alerts={incomingAlerts}
              activeAssignment={activeAssignment}
              onAccept={(alertId) => void handleAlertAction("accept", alertId)}
              onDecline={(alertId) => void handleAlertAction("decline", alertId)}
              onRequestBackup={(assignmentId) =>
                void handleAssignmentAction("backup", assignmentId)
              }
              onMarkArrived={(assignmentId) =>
                void handleAssignmentAction("arrived", assignmentId)
              }
              onMarkComplete={(assignmentId) =>
                void handleAssignmentAction("complete", assignmentId)
              }
            />
          </>
        ) : (
          <>
            <PatientHomeState
              firstName={firstName}
              vitals={vitals}
              hasActiveIncident={Boolean(activeIncident?.incident)}
              isSubmitting={isSubmitting}
              onSosPress={() => void handleSosPress()}
            />
            <EmergencyGuidanceCard
              hasActiveIncident={Boolean(activeIncident?.incident)}
              isTriggeringWearable={isTriggeringWearable}
              vitals={vitals}
              onTriggerWearable={() => void handleWearableTrigger()}
            />
            {activeIncident?.incident ? (
              <ActiveIncidentCard
                incidentState={activeIncident}
                onCancel={() => void handleSosPress()}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center" },
  safeArea: { flex: 1, backgroundColor: "#F2F3F5" },
  container: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 40 },
  authCard: {
    margin: 24,
    marginTop: 80,
    backgroundColor: "#111827",
    borderRadius: 32,
    padding: 24,
  },
  authEyebrow: {
    color: "#93C5FD",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 8,
    fontFamily: "InterBold",
  },
  authTitle: {
    color: "#F9FAFB",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 32,
    marginBottom: 10,
    fontFamily: "InterBold",
  },
  authBody: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    fontFamily: "Inter",
  },
  authLink: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    fontFamily: "InterBold",
  },
});
