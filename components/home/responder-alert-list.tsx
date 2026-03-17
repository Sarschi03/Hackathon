import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function ResponderAlertList({
  alerts,
  activeAssignment,
  onAccept,
  onDecline,
  onRequestBackup,
  onMarkArrived,
  onMarkComplete,
}: {
  alerts: any[] | undefined;
  activeAssignment: any;
  onAccept: (alertId: string) => void;
  onDecline: (alertId: string) => void;
  onRequestBackup: (assignmentId: string) => void;
  onMarkArrived: (assignmentId: string) => void;
  onMarkComplete: (assignmentId: string) => void;
}) {
  return (
    <View style={styles.section}>
      {activeAssignment ? (
        <View style={styles.assignmentCard}>
          <Text style={styles.sectionTitle}>Assigned incident</Text>
          <Text style={styles.assignmentStatus}>{activeAssignment.assignment.displayStatus}</Text>
          <Text style={styles.assignmentMeta}>
            {activeAssignment.patientName} | {activeAssignment.assignment.etaLabel}
          </Text>
          <Text style={styles.assignmentMeta}>{activeAssignment.incidentLocationLabel}</Text>
          <SummaryBlock medicalSummary={activeAssignment.medicalSummary} />
          <View style={styles.actionRow}>
            <SmallAction
              label="Request backup"
              onPress={() => onRequestBackup(String(activeAssignment.assignment._id))}
            />
            <SmallAction
              label="Arrived"
              onPress={() => onMarkArrived(String(activeAssignment.assignment._id))}
            />
            <SmallAction
              label="Complete"
              onPress={() => onMarkComplete(String(activeAssignment.assignment._id))}
            />
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Incoming alerts</Text>
      {alerts && alerts.length > 0 ? (
        alerts.map((alert) => (
          <View key={alert._id} style={styles.alertCard}>
            <Text style={styles.alertEta}>{alert.etaLabel}</Text>
            <Text style={styles.alertPatient}>{alert.patientName}</Text>
            <Text style={styles.alertMeta}>
              {alert.stageLabel} | {alert.travelModeLabel} | {alert.incidentLocationLabel}
            </Text>
            <SummaryBlock medicalSummary={alert.medicalSummary} />
            <View style={styles.actionRow}>
              <SmallAction label="Decline" secondary onPress={() => onDecline(String(alert._id))} />
              <SmallAction label="Accept" onPress={() => onAccept(String(alert._id))} />
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No active alerts</Text>
          <Text style={styles.emptyBody}>
            Keep availability on and location fresh to receive the next incident.
          </Text>
        </View>
      )}
    </View>
  );
}

function SummaryBlock({ medicalSummary }: { medicalSummary: any }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryTitle}>Emergency summary</Text>
      <Text style={styles.summaryLine}>Blood group: {medicalSummary?.bloodGroup || "Unknown"}</Text>
      <Text style={styles.summaryLine}>Allergies: {medicalSummary?.allergies || "None listed"}</Text>
      <Text style={styles.summaryLine}>Conditions: {medicalSummary?.conditions || "None listed"}</Text>
      <Text style={styles.summaryLine}>Medications: {medicalSummary?.medications || "None listed"}</Text>
    </View>
  );
}

function SmallAction({
  label,
  onPress,
  secondary,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      style={[styles.actionButton, secondary && styles.actionButtonSecondary]}
      onPress={onPress}
    >
      <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 4,
    fontFamily: "InterSemiBold",
    paddingLeft: 4,
  },
  assignmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#4BAEE8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  assignmentStatus: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1C22",
    marginTop: 8,
    fontFamily: "InterBold",
  },
  assignmentMeta: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
    fontFamily: "Inter",
  },
  alertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  alertEta: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1C22",
    fontFamily: "InterBold",
  },
  alertPatient: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1C22",
    marginTop: 6,
    fontFamily: "InterSemiBold",
  },
  alertMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6B7280",
    marginTop: 4,
    fontFamily: "Inter",
  },
  summaryBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    fontFamily: "InterBold",
  },
  summaryLine: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4B5563",
    marginBottom: 4,
    fontFamily: "Inter",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
  },
  actionButton: {
    backgroundColor: "rgba(13, 13, 13, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    // Glass shimmer effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  actionButtonSecondary: {
    backgroundColor: "transparent",
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  actionText: {
    color: "#1A1C22",
    fontWeight: "600",
    fontFamily: "InterSemiBold",
    fontSize: 14,
  },
  actionTextSecondary: {
    color: "#6B7280",
  },
  emptyCard: {
    backgroundColor: "rgba(165, 165, 165, 0.05)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1C22",
    marginBottom: 6,
    fontFamily: "InterBold",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Inter",
  },
});
