import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useLocalization } from "@/hooks/use-localization";

export function ResponderAvailabilityCard({
  responderProfile,
  onToggleAvailability,
  onSelectTravelMode,
}: {
  responderProfile: any;
  onToggleAvailability: (value: boolean) => void;
  onSelectTravelMode: (mode: "walking" | "driving") => void;
  onSelectCoverage?: (maxAlertEtaSeconds: number) => void;
}) {
  const { t } = useLocalization();
  const [localIsAvailable, setLocalIsAvailable] = React.useState(
    Boolean(responderProfile?.isAvailable)
  );

  // Sync local state when prop changes (e.g. from server)
  React.useEffect(() => {
    setLocalIsAvailable(Boolean(responderProfile?.isAvailable));
  }, [responderProfile?.isAvailable]);

  const handleToggle = (value: boolean) => {
    setLocalIsAvailable(value);
    onToggleAvailability(value);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>
            {localIsAvailable ? t("resp_available") : t("resp_unavailable")}
          </Text>
          <Text style={styles.title}>
            {responderProfile?.verificationStatus === "verified"
              ? t("resp_live_dispatch")
              : t("resp_verification_pending")}
          </Text>
        </View>
      </View>

      <Text style={styles.meta}>
        {t("resp_travel_mode_desc")}
      </Text>

      <Pressable 
        style={styles.toggleRow} 
        onPress={() => handleToggle(!localIsAvailable)}
      >
        <Text style={styles.toggleLabel}>{t("resp_availability_status")}</Text>
        <Switch
          value={localIsAvailable}
          onValueChange={handleToggle}
          trackColor={{ false: "#D1D5DB", true: "#4BAEE8" }}
          ios_backgroundColor="#D1D5DB"
          style={{ transform: [{ scale: 1.5 }] }}
          // Ensure the switch doesn't swallow the press if the row is tapped
          pointerEvents="none"
        />
      </Pressable>

      <View style={styles.modeRow}>
        <Pressable
          style={[
            styles.modeButton,
            responderProfile?.preferredTravelMode !== "driving" && styles.modeButtonActive,
          ]}
          onPress={() => onSelectTravelMode("walking")}
        >
          <Text
            style={[
              styles.modeButtonText,
              responderProfile?.preferredTravelMode !== "driving" && styles.modeButtonTextActive,
            ]}
          >
            {t("resp_walking")}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.modeButton,
            responderProfile?.preferredTravelMode === "driving" && styles.modeButtonActive,
          ]}
          onPress={() => onSelectTravelMode("driving")}
        >
          <Text
            style={[
              styles.modeButtonText,
              responderProfile?.preferredTravelMode === "driving" && styles.modeButtonTextActive,
            ]}
          >
            {t("resp_driving")}
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
    padding: 22,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  eyebrow: {
    color: "#4BAEE8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 4,
    fontFamily: "InterSemiBold",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    color: "#1A1C22",
    fontFamily: "InterBold",
    maxWidth: "80%",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(13, 13, 13, 0.04)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1C22",
    fontFamily: "InterSemiBold",
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666666",
    marginBottom: 16,
    fontFamily: "Inter",
  },
  modeRow: {
    flexDirection: "row",
    gap: 12,
  },
  modeButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "rgba(13, 13, 13, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingVertical: 13,
    alignItems: "center",
    // Subtle glass shimmer
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  modeButtonActive: {
    backgroundColor: "rgba(13, 13, 13, 0.22)",
    borderColor: "rgba(0, 0, 0, 0.15)",
  },
  modeButtonText: {
    color: "#6B7280",
    fontWeight: "600",
    fontFamily: "InterSemiBold",
    fontSize: 15,
  },
  modeButtonTextActive: {
    color: "#1A1C22",
    fontWeight: "700",
    fontFamily: "InterBold",
  },
});
