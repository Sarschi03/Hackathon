import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type PatientHomeStateProps = {
  firstName: string;
  hasMedicalProfile: boolean;
  contactsCount: number;
  hasActiveIncident: boolean;
  isSubmitting: boolean;
  onSosPress: () => void;
};

export function PatientHomeState({
  firstName,
  hasMedicalProfile,
  contactsCount,
  hasActiveIncident,
  isSubmitting,
  onSosPress,
}: PatientHomeStateProps) {
  return (
    <View style={styles.shell}>
      <Text style={styles.eyebrow}>Patient mode</Text>
      <Text style={styles.title}>{firstName}, your emergency path is ready.</Text>
      <Text style={styles.subtitle}>
        Keep your medical profile and contacts ready so the SOS flow reaches a responder cleanly.
      </Text>

      <Pressable
        style={[styles.sosButton, hasActiveIncident && styles.sosButtonActive]}
        onPress={onSosPress}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.sosLabel}>{hasActiveIncident ? "Cancel SOS" : "Press SOS"}</Text>
            <Text style={styles.sosHint}>
              {hasActiveIncident
                ? "An incident is live right now."
                : "If not cancelled, this escalates to responders after 10 seconds."}
            </Text>
          </>
        )}
      </Pressable>

      <View style={styles.checklist}>
        <ChecklistRow
          label="Medical profile"
          value={hasMedicalProfile ? "Ready" : "Needs data"}
          ready={hasMedicalProfile}
        />
        <ChecklistRow
          label="Emergency contacts"
          value={contactsCount > 0 ? `${contactsCount} added` : "Missing"}
          ready={contactsCount > 0}
        />
      </View>
    </View>
  );
}

function ChecklistRow({
  label,
  value,
  ready,
}: {
  label: string;
  value: string;
  ready: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, ready ? styles.rowReady : styles.rowPending]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: "#111827",
    borderRadius: 32,
    padding: 24,
    marginBottom: 16,
  },
  eyebrow: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  sosButton: {
    backgroundColor: "#DC2626",
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 18,
  },
  sosButtonActive: {
    backgroundColor: "#B91C1C",
  },
  sosLabel: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sosHint: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },
  checklist: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  rowReady: {
    color: "#86EFAC",
  },
  rowPending: {
    color: "#FDE68A",
  },
});
