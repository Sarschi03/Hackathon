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
            {activeAssignment.patientName} • {activeAssignment.assignment.etaLabel}
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
              {alert.stageLabel} • {alert.incidentLocationLabel}
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
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  assignmentCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 28,
    padding: 18,
  },
  assignmentStatus: {
    fontSize: 22,
    fontWeight: "800",
    color: "#9A3412",
    marginTop: 4,
  },
  assignmentMeta: {
    fontSize: 14,
    color: "#7C2D12",
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
  },
  alertEta: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  alertPatient: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 6,
  },
  alertMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  summaryLine: {
    fontSize: 13,
    lineHeight: 18,
    color: "#334155",
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  },
  actionButton: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  actionButtonSecondary: {
    backgroundColor: "#E2E8F0",
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  actionTextSecondary: {
    color: "#0F172A",
  },
  emptyCard: {
    backgroundColor: "#E2E8F0",
    borderRadius: 24,
    padding: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
});
