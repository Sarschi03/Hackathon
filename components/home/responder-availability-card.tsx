import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function ResponderAvailabilityCard({
  responderProfile,
  onToggleAvailability,
  onSelectTravelMode,
  onSelectCoverage,
}: {
  responderProfile: any;
  onToggleAvailability: () => void;
  onSelectTravelMode: (mode: "walking" | "driving") => void;
  onSelectCoverage: (maxAlertEtaSeconds: number) => void;
}) {
  const coverageOptions = [
    { label: "3 min", value: 180 },
    { label: "6 min", value: 360 },
    { label: "10 min", value: 600 },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Responder dispatch</Text>
      <Text style={styles.title}>
        {responderProfile?.verificationStatus === "verified"
          ? "You are live for incoming alerts."
          : "Verification is still blocking dispatch."}
      </Text>
      <Text style={styles.meta}>
        Verification: {responderProfile?.verificationStatus ?? "missing"}{"\n"}
        Availability: {responderProfile?.isAvailable ? "Available" : "Unavailable"}{"\n"}
        Travel mode: {responderProfile?.preferredTravelMode ?? "walking"}{"\n"}
        Coverage: {Math.round((responderProfile?.maxAlertEtaSeconds ?? 600) / 60)} min ETA
      </Text>
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
            Walking
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
            Driving
          </Text>
        </Pressable>
      </View>
      <View style={styles.coverageRow}>
        {coverageOptions.map((option) => {
          const isActive = (responderProfile?.maxAlertEtaSeconds ?? 600) === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.coverageButton, isActive && styles.coverageButtonActive]}
              onPress={() => onSelectCoverage(option.value)}
            >
              <Text style={[styles.coverageText, isActive && styles.coverageTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.button} onPress={onToggleAvailability}>
        <Text style={styles.buttonText}>
          {responderProfile?.isAvailable ? "Go unavailable" : "Go available"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#14323F",
    borderRadius: 32,
    padding: 22,
    marginBottom: 16,
  },
  eyebrow: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28,
    color: "#F0FDFA",
    marginBottom: 10,
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
    color: "#CFFAFE",
    marginBottom: 14,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  coverageRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  modeButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(240,253,250,0.35)",
    paddingVertical: 11,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#F0FDFA",
    borderColor: "#F0FDFA",
  },
  modeButtonText: {
    color: "#CFFAFE",
    fontWeight: "700",
  },
  modeButtonTextActive: {
    color: "#14323F",
  },
  coverageButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(240,253,250,0.28)",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  coverageButtonActive: {
    backgroundColor: "rgba(240,253,250,0.16)",
    borderColor: "#F0FDFA",
  },
  coverageText: {
    color: "#CFFAFE",
    fontWeight: "700",
  },
  coverageTextActive: {
    color: "#F0FDFA",
  },
  button: {
    backgroundColor: "#F0FDFA",
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: "center",
  },
  buttonText: {
    color: "#14323F",
    fontWeight: "800",
  },
});
