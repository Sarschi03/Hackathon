import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// --- EKG Line (View-based approximation as per user snippet) ---
const EKGLine: React.FC = () => {
  return (
    <View style={styles.ekgContainer}>
      <View style={styles.ekgLineWrapper}>
        <View style={[styles.ekgSegment, { width: 40 }]} />
        <View style={[styles.ekgPeak, { height: 14, marginBottom: 14 }]} />
        <View style={[styles.ekgSegment, { width: 6 }]} />
        <View style={[styles.ekgDip, { height: 8, marginTop: 8 }]} />
        <View style={[styles.ekgSegment, { width: 4 }]} />
        <View style={[styles.ekgPeak, { height: 30, marginBottom: 30 }]} />
        <View style={[styles.ekgSegment, { width: 4 }]} />
        <View style={[styles.ekgDip, { height: 12, marginTop: 12 }]} />
        <View style={[styles.ekgSegment, { width: 10 }]} />
        <View style={[styles.ekgPeak, { height: 8, marginBottom: 8 }]} />
        <View style={[styles.ekgSegment, { width: 6 }]} />
        <View style={[styles.ekgDip, { height: 5, marginTop: 5 }]} />
        <View style={[styles.ekgSegment, { width: 40 }]} />
        <View style={[styles.ekgPeak, { height: 14, marginBottom: 14 }]} />
        <View style={[styles.ekgSegment, { width: 6 }]} />
        <View style={[styles.ekgDip, { height: 8, marginTop: 8 }]} />
        <View style={[styles.ekgSegment, { width: 4 }]} />
        <View style={[styles.ekgPeak, { height: 30, marginBottom: 30 }]} />
        <View style={[styles.ekgSegment, { width: 4 }]} />
        <View style={[styles.ekgDip, { height: 12, marginTop: 12 }]} />
        <View style={[styles.ekgSegment, { width: 10 }]} />
        <View style={[styles.ekgPeak, { height: 8, marginBottom: 8 }]} />
        <View style={[styles.ekgSegment, { width: 6 }]} />
        <View style={[styles.ekgDip, { height: 5, marginTop: 5 }]} />
        <View style={[styles.ekgSegment, { width: 40 }]} />
      </View>
    </View>
  );
};

// --- Heart Icon ---
const HeartIcon: React.FC<{ color?: string }> = ({ color = "#4BAEE8" }) => (
  <View style={[styles.heartIconWrapper, { backgroundColor: color + "20" }]}>
    <Text style={[styles.heartIconText, { color }]}>♥︎</Text>
  </View>
);

// --- Vital Card ---
interface VitalCardProps {
  label: string;
  value: string | number;
  unit: string;
  accentColor: string;
}

const VitalCard: React.FC<VitalCardProps> = ({ label, value, unit, accentColor }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.vitalCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.vitalCardAccent, { backgroundColor: accentColor }]} />
      <View style={styles.vitalCardContent}>
        <View style={styles.vitalCardHeader}>
          <HeartIcon color={accentColor} />
          <Text style={[styles.vitalCardLabel, { color: accentColor }]}>{label}</Text>
        </View>
        <View style={styles.vitalCardValueRow}>
          <Text style={styles.vitalCardValue}>{value}</Text>
          <Text style={styles.vitalCardUnit}>{unit}</Text>
        </View>
        <View style={[styles.vitalCardBar, { backgroundColor: accentColor + "30" }]}>
          <View style={[styles.vitalCardBarFill, { backgroundColor: accentColor, width: "65%" }]} />
        </View>
      </View>
    </Animated.View>
  );
};

export type PatientHomeStateProps = {
  firstName: string;
  heartRate: number | null;
  bloodOxygen: number | null;
  hasActiveIncident: boolean;
  isSubmitting: boolean;
  onSosPress: () => void;
};

export function PatientHomeState({
  firstName,
  heartRate,
  bloodOxygen,
  hasActiveIncident,
  isSubmitting,
  onSosPress,
}: PatientHomeStateProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const sosScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // SOS pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sosScale, {
          toValue: 1.015,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(sosScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [fadeAnim, slideAnim, sosScale]);

  return (
    <View style={styles.container}>
      {/* SOS Button */}
      <Animated.View style={{ transform: [{ scale: sosScale }], marginBottom: 28 }}>
        <Pressable
          style={[styles.sosButton, hasActiveIncident && styles.sosButtonActive]}
          onLongPress={onSosPress}
          onPress={() => {
            if (hasActiveIncident) onSosPress();
          }}
          disabled={isSubmitting}
        >
          <View>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.sosText}>{hasActiveIncident ? "CANCEL" : "SOS!"}</Text>
                {!hasActiveIncident && (
                  <Text style={styles.sosSubtext}>Hold to activate!</Text>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Animated.View>

      {/* Greeting */}
      <Animated.View
        style={[
          styles.greetingBlock,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.greetingName}>{firstName},</Text>
        <Text style={styles.greetingTitle}>Check{"\n"}your Vitals!</Text>
      </Animated.View>

      {/* EKG Card */}
      <Animated.View style={[styles.ekgCard, { opacity: fadeAnim }]}>
        <View style={[styles.ekgCardAccent, { backgroundColor: "#F5C09D" }]} />
        <View style={styles.ekgCardHeader}>
          <View style={styles.ekgCardLabelRow}>
            <HeartIcon color="#4BAEE8" />
            <Text style={styles.ekgCardLabel}>EKG</Text>
          </View>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <EKGLine />
      </Animated.View>

      {/* Vitals Grid */}
      <View style={styles.vitalsGrid}>
        <VitalCard
          label="Pulse"
          value={heartRate ?? "98"}
          unit="br/min"
          accentColor="#4BAEE8"
        />
        <VitalCard
          label="Blood oxygen"
          value={bloodOxygen ?? "98"}
          unit="SpO2%"
          accentColor="#4BAEE8"
        />
        <VitalCard
          label="Blood Pressure"
          value="118/70"
          unit="mmHg"
          accentColor="#4BAEE8"
        />
        <VitalCard
          label="Respiratory rate"
          value="16"
          unit="br/min"
          accentColor="#4BAEE8"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  // SOS
  sosButton: {
    borderRadius: 22,
    backgroundColor: "#F4A8A8",
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E07070",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 15,
  },
  sosButtonActive: {
    backgroundColor: "#DC2626",
  },
  sosText: {
    fontSize: 42,
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: 2,
    fontFamily: "Inter",
  },
  sosSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
    fontWeight: "400",
    fontFamily: "Inter",
  },

  // Greeting
  greetingBlock: {
    marginBottom: 40,
  },
  greetingName: {
    fontSize: 17,
    color: "#B0B3BA",
    fontWeight: "400",
    marginBottom: 2,
    fontFamily: "Inter",
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: "500",
    color: "#1A1C22",
    lineHeight: 40,
    fontFamily: "InterMedium",
  },

  // EKG Card
  ekgCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#676767ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    height: 180,

  },
  ekgCardAccent: {
    height: 4,
    width: "100%",
    alignContent: "center",
    alignSelf: "center",
    borderRadius: 10,
  },
  ekgCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  ekgCardLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ekgCardLabel: {
    fontSize: 14,
    color: "#4BAEE8",
    fontWeight: "400",
    marginLeft: 10,
    fontFamily: "Inter",
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4BAEE8",
  },
  liveText: {
    fontSize: 12,
    color: "#B0B3BA",
    marginLeft: 4,
    fontFamily: "Inter",
  },

  // EKG Line
  ekgContainer: {
    height: 120,
    paddingHorizontal: 16,
    paddingBottom: 18,
    justifyContent: "center",
    overflow: "hidden",
  },
  ekgLineWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  ekgSegment: {
    height: 2,
    backgroundColor: "#555",
  },
  ekgPeak: {
    width: 2,
    backgroundColor: "#555",
    alignSelf: "flex-end",
  },
  ekgDip: {
    width: 2,
    backgroundColor: "#555",
    alignSelf: "flex-start",
  },

  // Vitals Grid
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // Vital Card
  vitalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
    width: (width - 40 - 8) / 2,
    overflow: "hidden",
    shadowColor: "#878787ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 2,

  },
  vitalCardAccent: {
    height: 4,
    width: "100%",
  },
  vitalCardContent: {
    padding: 18,
    height: 150,
  },
  vitalCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    gap: 4,
  },
  vitalCardLabel: {
    fontSize: 13,
    fontWeight: "400",
    marginLeft: 4,
    fontFamily: "Inter",
  },
  vitalCardValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 14,
    gap: 4,
  },
  vitalCardValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1C22",
    lineHeight: 36,
    fontFamily: "Inter",
  },
  vitalCardUnit: {
    fontSize: 13,
    color: "#B0B3BA",
    marginBottom: 4,
    fontWeight: "400",
    fontFamily: "Inter",
  },
  vitalCardBar: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  vitalCardBarFill: {
    height: "100%",
    borderRadius: 2,
  },

  // Heart icon
  heartIconWrapper: {
    width: 27,
    height: 27,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  heartIconText: {
    fontSize: 15,
    fontFamily: "Inter",
  },
});
