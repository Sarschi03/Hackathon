import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function ResponderAvailabilityCard({
  responderProfile,
  onToggleAvailability,
}: {
  responderProfile: any;
  onToggleAvailability: () => void;
}) {
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
        Availability: {responderProfile?.isAvailable ? "Available" : "Unavailable"}
      </Text>
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
    marginBottom: 16,
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
