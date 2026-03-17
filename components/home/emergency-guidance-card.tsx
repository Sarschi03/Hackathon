import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DemoVitalsState } from "@/hooks/use-demo-vitals";

type EmergencyGuidanceCardProps = {
  hasActiveIncident: boolean;
  isTriggeringWearable: boolean;
  vitals: DemoVitalsState;
  onTriggerWearable: () => void;
};

const GUIDANCE_STEPS = [
  "Call 144 and confirm the exact floor or entrance for responders.",
  "Start CPR immediately if the patient is unresponsive and not breathing normally.",
  "Send one person to look for an AED while another stays with the patient.",
];

export function EmergencyGuidanceCard({
  hasActiveIncident,
  isTriggeringWearable,
  vitals,
  onTriggerWearable,
}: EmergencyGuidanceCardProps) {
  const riskLabel =
    vitals.heartRate > 108 || vitals.bloodOxygen < 95 ? "Elevated" : "Stable";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Guided response</Text>
          <Text style={styles.title}>What happens in the first minute</Text>
        </View>
        <View style={[styles.riskChip, riskLabel === "Elevated" && styles.riskChipAlert]}>
          <Text style={styles.riskChipText}>{riskLabel}</Text>
        </View>
      </View>

      {GUIDANCE_STEPS.map((step, index) => (
        <View key={step} style={styles.stepRow}>
          <View style={styles.stepIndex}>
            <Text style={styles.stepIndexText}>{index + 1}</Text>
          </View>
          <Text style={styles.stepBody}>{step}</Text>
        </View>
      ))}

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Wearable trigger</Text>
          <Text style={styles.footerBody}>
            Simulate an automatic emergency escalation with live vitals attached.
          </Text>
        </View>
        <Pressable
          style={[styles.footerButton, hasActiveIncident && styles.footerButtonDisabled]}
          onPress={onTriggerWearable}
          disabled={hasActiveIncident || isTriggeringWearable}
        >
          <Text style={styles.footerButtonText}>
            {isTriggeringWearable ? "Sending..." : "Simulate"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0F172A",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  eyebrow: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28,
    marginTop: 6,
  },
  riskChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  riskChipAlert: {
    backgroundColor: "rgba(248, 113, 113, 0.18)",
  },
  riskChipText: {
    color: "#F8FAFC",
    fontWeight: "700",
    fontSize: 12,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepIndexText: {
    color: "#EFF6FF",
    fontWeight: "800",
  },
  stepBody: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.2)",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
  },
  footerLabel: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  footerBody: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 220,
  },
  footerButton: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerButtonDisabled: {
    opacity: 0.5,
  },
  footerButtonText: {
    color: "#0F172A",
    fontWeight: "800",
  },
});
