import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalization } from "@/hooks/use-localization";

export function ActiveIncidentCard({
  incidentState,
  onCancel,
}: {
  incidentState: any;
  onCancel: () => void;
}) {
  const { t } = useLocalization();
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('incident_title')}</Text>
        <Text style={styles.severity}>{incidentState.incident.severity.toUpperCase()}</Text>
      </View>
      <Text style={styles.status}>{incidentState.displayStatus}</Text>
      <Text style={styles.location}>{incidentState.incidentLocationLabel}</Text>
      {incidentState.escalationLabel ? (
        <Text style={styles.meta}>{t('incident_stage')}: {incidentState.escalationLabel}</Text>
      ) : null}
      {incidentState.assignment ? (
        <View style={styles.assignmentBox}>
          <Text style={styles.assignmentTitle}>{t('incident_responder')}</Text>
          <Text style={styles.assignmentBody}>
            {incidentState.assignment.responderName} • {incidentState.assignment.displayStatus}
          </Text>
          <Text style={styles.assignmentMeta}>{incidentState.assignment.etaLabel}</Text>
        </View>
      ) : (
        <Text style={styles.meta}>
          {incidentState.timeline.at(-1)?.message ?? t('incident_waiting')}
        </Text>
      )}
      <Pressable style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelText}>{t('btn_cancel_incident')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "InterBold",
  },
  severity: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    fontFamily: "InterBold",
  },
  status: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    fontFamily: "InterBold",
  },
  location: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    fontFamily: "Inter",
  },
  meta: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    fontFamily: "Inter",
  },
  assignmentBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },
  assignmentTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#6B7280",
    marginBottom: 6,
    fontFamily: "InterBold",
  },
  assignmentBody: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "InterBold",
  },
  assignmentMeta: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 4,
    fontFamily: "Inter",
  },
  cancelButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: "#111827",
  },
  cancelText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontFamily: "InterBold",
  },
});
