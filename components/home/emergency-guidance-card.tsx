import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DemoVitalsState } from "@/hooks/use-demo-vitals";

type EmergencyGuidanceCardProps = {
  hasActiveIncident: boolean;
  isTriggeringWearable: boolean;
  vitals: DemoVitalsState;
  onTriggerWearable: () => void;
};

import { useLocalization } from "@/hooks/use-localization";

export function EmergencyGuidanceCard({
  hasActiveIncident,
  isTriggeringWearable,
  vitals,
  onTriggerWearable,
}: EmergencyGuidanceCardProps) {
  const { t } = useLocalization();

  const GUIDANCE_STEPS = [
    t("guidance_step_1"),
    t("guidance_step_2"),
    t("guidance_step_3"),
  ];

  const riskLabel =
    vitals.heartRate > 108 || vitals.bloodOxygen < 95 ? t("guidance_risk_elevated") : t("guidance_risk_stable");

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{t("guidance_eyebrow")}</Text>
          <Text style={styles.title}>{t("guidance_title")}</Text>
        </View>
        <View style={[styles.riskChip, riskLabel === t("guidance_risk_elevated") && styles.riskChipAlert]}>
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
          <Text style={styles.footerLabel}>{t("guidance_footer_label")}</Text>
          <Text style={styles.footerBody}>
            {t("guidance_footer_body")}
          </Text>
        </View>
        <Pressable
          style={[styles.footerButton, hasActiveIncident && styles.footerButtonDisabled]}
          onPress={onTriggerWearable}
          disabled={hasActiveIncident || isTriggeringWearable}
        >
          <Text style={styles.footerButtonText}>
            {isTriggeringWearable ? t("guidance_btn_sending") : t("guidance_btn_simulate")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 20,
  },
  eyebrow: {
    color: "#4BAEE8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontFamily: "InterSemiBold",
  },
  title: {
    color: "#1A1C22",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
    marginTop: 6,
    fontFamily: "InterBold",
  },
  riskChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(165, 165, 165, 0.1)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  riskChipAlert: {
    backgroundColor: "rgba(248, 113, 113, 0.1)",
  },
  riskChipText: {
    color: "#666666",
    fontWeight: "600",
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(165, 165, 165, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(165, 165, 165, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepIndexText: {
    color: "#666666",
    fontWeight: "700",
    fontFamily: "InterBold",
    fontSize: 13,
  },
  stepBody: {
    flex: 1,
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter",
  },
  footer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
  },
  footerLabel: {
    color: "#1A1C22",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "InterSemiBold",
  },
  footerBody: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 220,
    fontFamily: "Inter",
  },
  footerButton: {
    backgroundColor: "rgba(13, 13, 13, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    // Glass shimmer effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  footerButtonDisabled: {
    opacity: 0.4,
  },
  footerButtonText: {
    color: "#1A1C22",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
});
