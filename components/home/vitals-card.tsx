import { useHealthConnect } from "@/hooks/use-health-connect";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

/** Pulsing dot - indicator for live data */
const LiveIndicator = () => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View style={styles.liveWrapper}>
      <Animated.View style={[styles.liveDot, { opacity }]} />
      <Text style={styles.liveText}>Live</Text>
    </View>
  );
};

/** Stylized Heart Icon with pulse line inside */
const HeartBox = ({ color = "#4FACFE" }: { color?: string }) => (
  <View style={[styles.heartIconCircle, { backgroundColor: color }]}>
    <Ionicons name="heart" size={16} color="#fff" />
  </View>
);

/** EKG Graph - Generic styled SVG path */
const EkgGraph = () => (
  <Svg height="80" width="100%" viewBox="0 0 300 80">
    <Path
      d="M0 40 L40 40 L45 30 L55 50 L60 40 L100 40 L110 10 L125 70 L140 40 L180 40 L185 30 L195 50 L200 40 L240 40 L250 10 L265 70 L280 40 L300 40"
      fill="none"
      stroke="#4A4E54"
      strokeWidth="2"
    />
  </Svg>
);

export function VitalsCard() {
  const { heartRate, bloodOxygen, isAvailable } = useHealthConnect();

  const hrValue = heartRate != null ? heartRate : 98; // Fallback to 98 if no data yet (mockup use case)
  const spo2Value = bloodOxygen != null ? bloodOxygen : 98;

  return (
    <View style={styles.container}>
      {/* EKG Card */}
      <View style={styles.mainCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <HeartBox color="#4FACFE" />
            <Text style={styles.cardTitle}>EKG</Text>
          </View>
          {isAvailable && <LiveIndicator />}
        </View>
        <View style={styles.graphContainer}>
          <EkgGraph />
        </View>
        <View style={[styles.footerBar, { backgroundColor: "#FFB067" }]} />
      </View>

      {/* 2x2 Grid Section */}
      <View style={styles.grid}>
        {/* Pulse */}
        <View style={styles.smallCard}>
          <View style={styles.cardHeaderSmall}>
            <HeartBox color="#4FACFE" />
            <Text style={styles.cardTitleSmall}>Pulse</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.mainValue}>{hrValue}</Text>
            <Text style={styles.unit}>br/min</Text>
          </View>
          <View style={[styles.footerBar, { backgroundColor: "#FFB067" }]} />
        </View>

        {/* Blood Oxygen */}
        <View style={styles.smallCard}>
          <View style={styles.cardHeaderSmall}>
            <HeartBox color="#4FACFE" />
            <Text style={styles.cardTitleSmall}>Blood oxygen</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.mainValue}>{spo2Value}</Text>
            <Text style={styles.unit}>SpO2%</Text>
          </View>
          <View style={[styles.footerBar, { backgroundColor: "#4FACFE" }]} />
        </View>

        {/* Blood Pressure */}
        <View style={styles.smallCard}>
          <View style={styles.cardHeaderSmall}>
            <HeartBox color="#4FACFE" />
            <Text style={styles.cardTitleSmall}>Blood Pressure</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.mainValue}>118/70</Text>
            <Text style={styles.unit}>mmHg</Text>
          </View>
          <View style={[styles.footerBar, { backgroundColor: "#4FACFE" }]} />
        </View>

        {/* Respiratory Rate */}
        <View style={styles.smallCard}>
          <View style={styles.cardHeaderSmall}>
            <HeartBox color="#4FACFE" />
            <Text style={styles.cardTitleSmall}>Raspitory rate</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.mainValue}>16</Text>
            <Text style={styles.unit}>br/min</Text>
          </View>
          <View style={[styles.footerBar, { backgroundColor: "#4FACFE" }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    gap: 16,
  },
  mainCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    paddingBottom: 0, // Footer bar at bottom
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.00,
    shadowRadius: 0,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heartIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D1D5DB",
    textTransform: "uppercase",
  },
  liveWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F87171",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#D1D5DB",
    fontStyle: "italic",
  },
  graphContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  smallCard: {
    backgroundColor: "#FFFFFF",
    width: "48%",
    borderRadius: 16,
    padding: 16,
    paddingBottom: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitleSmall: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D1D5DB",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 12,
  },
  mainValue: {
    fontSize: 42,
    fontWeight: "500",
    color: "#000",
  },
  unit: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  footerBar: {
    height: 3,
    width: "70%",
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 0,
  },
});
