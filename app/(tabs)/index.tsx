import * as Location from "expo-location";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "@/convex/_generated/api";
import { ActiveIncidentCard } from "@/components/home/active-incident-card";
import { PatientHomeState } from "@/components/home/patient-home-state";
import { ResponderAlertList } from "@/components/home/responder-alert-list";
import { ResponderAvailabilityCard } from "@/components/home/responder-availability-card";
import { useAppSession } from "@/hooks/use-app-session";

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
  const { sessionToken, isReady, viewer, currentRole, isAuthenticated } = useAppSession();
  const activeIncident = useQuery(
    api.incidents.getActiveIncidentForViewer,
    sessionToken && currentRole === "citizen" ? { sessionToken } : "skip",
  );
  const profile = useQuery(
    api.profiles.getMyProfile,
    sessionToken && currentRole === "citizen" ? { sessionToken } : "skip",
  );
  const contacts = useQuery(
    api.contacts.listMyContacts,
    sessionToken && currentRole === "citizen" ? { sessionToken } : "skip",
  );
  const responderProfile = useQuery(
    api.responders.getMyResponderProfile,
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
  const acceptAlert = useMutation(api.responders.acceptAlert);
  const declineAlert = useMutation(api.responders.declineAlert);
  const updateAssignmentStatus = useMutation(api.responders.updateAssignmentStatus);
  const requestBackup = useMutation(api.responders.requestBackup);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const viewerUser = (viewer as any)?.user;

  const firstName = useMemo(() => {
    const fullName = viewerUser?.fullName ?? "Friend";
    return fullName.split(" ")[0];
  }, [viewerUser?.fullName]);

  const hasMedicalProfile = Boolean(
    profile?.bloodGroup || profile?.allergiesText || profile?.conditionsText || profile?.medicationsText,
  );
  const contactsCount = contacts?.length ?? 0;

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
        const coords = await getCurrentCoordinates();
        await updateMyLocation({
          sessionToken,
          lat: coords.latitude,
          lng: coords.longitude,
          accuracyMeters: "accuracy" in coords ? coords.accuracy : undefined,
          source: "incident",
        });
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

  const handleToggleAvailability = async () => {
    if (!sessionToken || !responderProfile) {
      return;
    }
    try {
      const coords = await getCurrentCoordinates();
      await updateMyLocation({
        sessionToken,
        lat: coords.latitude,
        lng: coords.longitude,
        accuracyMeters: "accuracy" in coords ? coords.accuracy : undefined,
        source: "foreground",
      });
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

  const handleAlertAction = async (
    action: "accept" | "decline",
    alertId: string,
  ) => {
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
        Alert.alert("Backup requested", "Placeholder backup request was added to the incident timeline.");
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
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authCard}>
          <Text style={styles.authEyebrow}>FirstLine demo</Text>
          <Text style={styles.authTitle}>Sign in before testing the end-to-end flow.</Text>
          <Text style={styles.authBody}>
            Use a patient account for the SOS side or a responder account for dispatch.
          </Text>
          <Text style={styles.authLink} onPress={() => router.push("/login")}>
            Go to login
          </Text>
          <Text style={styles.authLink} onPress={() => router.push("/signup")}>
            Create account
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {currentRole === "responder" ? (
          <>
            <ResponderAvailabilityCard
              responderProfile={responderProfile}
              onToggleAvailability={() => void handleToggleAvailability()}
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
              hasMedicalProfile={hasMedicalProfile}
              contactsCount={contactsCount}
              hasActiveIncident={Boolean(activeIncident?.incident)}
              isSubmitting={isSubmitting}
              onSosPress={() => void handleSosPress()}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center" },
  safeArea: { flex: 1, backgroundColor: "#EEF2F7" },
  container: { padding: 20, paddingTop: 24, paddingBottom: 48 },
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
  },
  authTitle: {
    color: "#F9FAFB",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 32,
    marginBottom: 10,
  },
  authBody: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  authLink: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
});
