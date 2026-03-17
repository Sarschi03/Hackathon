import type { DemoVitalsState } from "@/hooks/use-demo-vitals";
import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { useLocalization } from "@/hooks/use-localization";

const ECG_STRIP_PATH = [
  "M 0 58",
  "C 8 58, 12 58, 20 58",
  "C 24 58, 28 54, 34 54",
  "C 38 54, 42 58, 48 58",
  "C 56 58, 64 58, 72 58",
  "L 78 60",
  "L 84 34",
  "L 90 70",
  "L 96 18",
  "L 103 84",
  "L 110 58",
  "C 120 58, 132 58, 144 58",
  "C 154 58, 162 56, 170 56",
  "C 180 56, 188 64, 200 64",
  "C 214 64, 226 58, 240 58",
  "C 252 58, 266 58, 280 58",
].join(" ");

function VitalIcon({ source }: { source: any }) {
  return (
    <View style={styles.iconWrapper}>
      <Image
        source={source}
        style={styles.vitalIcon}
        resizeMode="contain"
      />
    </View>
  );
}

function EcgLine() {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    sweep.setValue(0);
    const animation = Animated.loop(
      Animated.timing(sweep, {
        toValue: -280,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [sweep]);

  return (
    <View style={styles.ekgContainer}>
      <View style={styles.ekgGrid}>
        {Array.from({ length: 11 }).map((_, index) => (
          <View key={`v-${index}`} style={[styles.gridColumn, { left: index * 28 }]} />
        ))}
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={`h-${index}`} style={[styles.gridRow, { top: 18 + index * 22 }]} />
        ))}
      </View>

      <Animated.View
        style={[
          styles.waveTrack,
          {
            transform: [{ translateX: sweep }],
          },
        ]}
      >
        <EcgWave />
        <EcgWave />
        <EcgWave />
      </Animated.View>
    </View>
  );
}

function EcgWave() {
  return (
    <Svg width={280} height={110} viewBox="0 0 280 110">
      <Line x1="0" y1="58" x2="280" y2="58" stroke="#D9E0E7" strokeWidth="1.2" />
      <Path
        d={ECG_STRIP_PATH}
        fill="none"
        stroke="#4A5662"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function VitalCard({
  label,
  value,
  unit,
  accentColor,
  iconSource,
}: {
  label: string;
  value: string | number;
  unit: string;
  accentColor: string;
  iconSource: any;
}) {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const barWidth = useRef(new Animated.Value(1)).current;
  const barColor = useRef(new Animated.Value(0)).current;

  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  const isAlert = useMemo(() => {
    if (!label) return false;
    const lowerLabel = label.toLowerCase();
    
    // Pulse (BPM): 60-100 normal
    if (lowerLabel.includes("pulse") || lowerLabel.includes("puls")) {
      return numericValue < 60 || numericValue > 100;
    }
    // SpO2: 95-100 normal
    if (lowerLabel.includes("oxygen") || lowerLabel.includes("kisik")) {
      return numericValue < 95;
    }
    // Pressure: Systolic 90-140 normal
    if (lowerLabel.includes("pressure") || lowerLabel.includes("tlak")) {
      const systolic = typeof value === "string" ? parseInt(value.split("/")[0]) : 120;
      return systolic < 90 || systolic > 140;
    }
    // Respiratory: 12-20 normal
    if (lowerLabel.includes("respiratory") || lowerLabel.includes("dihanje")) {
      return numericValue < 12 || numericValue > 22;
    }
    return false;
  }, [label, numericValue, value]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(barWidth, {
        toValue: isAlert ? 0.7 : 1,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(barColor, {
        toValue: isAlert ? 1 : 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isAlert, scaleAnim, barWidth, barColor]);

  const animatedBarColor = useMemo(() => barColor.interpolate({
    inputRange: [0, 1],
    outputRange: [accentColor === "#a5a5a5ff" ? "#4FACFE" : accentColor, "#FF4B4B"],
  }), [barColor, accentColor]);

  const animatedBarWidth = useMemo(() => barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  }), [barWidth]);

  return (
    <Animated.View style={[styles.vitalCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.vitalCardContent}>
        <View style={styles.vitalCardHeader}>
          <VitalIcon source={iconSource} />
          <Text style={styles.vitalCardLabel}>{label}</Text>
        </View>
        <View style={styles.vitalCardValueRow}>
          <Text style={styles.vitalCardValue}>{value || "-"}</Text>
          <Text style={styles.vitalCardUnit}>{unit}</Text>
        </View>
        <View style={[styles.vitalCardBar, { backgroundColor: isAlert ? "#FF4B4B20" : "#E5E7EB" }]}>
          <Animated.View
            style={[
              styles.vitalCardBarFill,
              { 
                backgroundColor: animatedBarColor,
                width: animatedBarWidth,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

export type PatientHomeStateProps = {
  firstName: string;
  vitals: DemoVitalsState;
  hasActiveIncident: boolean;
  isSubmitting: boolean;
  onSosPress: () => void;
};

export function PatientHomeState({
  firstName,
  vitals,
  hasActiveIncident,
  isSubmitting,
  onSosPress,
}: PatientHomeStateProps) {
  const { t } = useLocalization();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;

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

    const createPulse = (val: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1.04,
            duration: 4500,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 1,
            duration: 4500,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulseAnim1 = createPulse(pulse1, 0);
    const pulseAnim2 = createPulse(pulse2, 400);
    const pulseAnim3 = createPulse(pulse3, 800);

    pulseAnim1.start();
    pulseAnim2.start();
    pulseAnim3.start();

    return () => {
      pulseAnim1.stop();
      pulseAnim2.stop();
      pulseAnim3.stop();
    };
  }, [fadeAnim, slideAnim, pulse1, pulse2, pulse3]);

  const pressure = useMemo(
    () => `${vitals.systolic}/${vitals.diastolic}`,
    [vitals.diastolic, vitals.systolic],
  );

  const { heartRate, bloodOxygen, respiratoryRate } = vitals;

  return (
    <View style={styles.container}>
      <View style={styles.sosContainer}>
        <Animated.View style={[styles.sosRing, styles.sosRing3, { transform: [{ scale: pulse3 }] }]} />
        <Animated.View style={[styles.sosRing, styles.sosRing2, { transform: [{ scale: pulse2 }] }]} />
        <Animated.View style={[styles.sosRing, styles.sosRing1, { transform: [{ scale: pulse1 }] }]}>
          <Pressable
            style={[styles.sosButton, hasActiveIncident && styles.sosButtonActive]}
            onLongPress={onSosPress}
            onPress={() => {
              if (hasActiveIncident) {
                onSosPress();
              }
            }}
            disabled={isSubmitting}
          >
            <View style={styles.sosContent}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="large" />
              ) : (
                <>
                  <Text style={styles.sosText}>{hasActiveIncident ? t('btn_cancel').toUpperCase() : `${t('home_sos')}!`}</Text>
                  {!hasActiveIncident ? (
                    <Text style={styles.sosSubtext}>{t('home_sos_subtext')}</Text>
                  ) : null}
                </>
              )}
            </View>
          </Pressable>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.greetingBlock,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.greetingName}>{firstName},</Text>
        <Text style={styles.greetingTitle}>{t('home_emergency_help')}</Text>
      </Animated.View>

      <Animated.View style={[styles.ekgCard, { opacity: fadeAnim }]}>
        <View style={styles.ekgCardHeader}>
          <View style={styles.ekgCardLabelRow}>
            <VitalIcon source={require("../../assets/images/icon.png")} />
            <Text style={styles.ekgCardLabel}>{t('home_ekg')}</Text>
          </View>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <EcgLine />
      </Animated.View>

      <View style={styles.vitalsGrid}>
        <VitalCard
          label={t('home_pulse')}
          value={heartRate}
          unit="bpm"
          accentColor="#a5a5a5ff"
          iconSource={require("../../assets/images/icon.png")}
        />
        <VitalCard
          label={t('home_blood_oxygen')}
          value={bloodOxygen}
          unit="SpO2%"
          accentColor="#a5a5a5ff"
          iconSource={require("../../assets/images/icon_blood.png")}
        />
        <VitalCard
          label={t('home_blood_pressure')}
          value={pressure}
          unit="mmHg"
          accentColor="#a5a5a5ff"
          iconSource={require("../../assets/images/icon_pressure.png")}
        />
        <VitalCard
          label={t('home_respiratory')}
          value={respiratoryRate}
          unit="bpm"
          accentColor="#a5a5a5ff"
          iconSource={require("../../assets/images/icon_blood.png")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
  },
  sosContainer: {
    height: 340,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  sosRing: {
    position: "absolute",
    borderRadius: 999,
  },
  sosRing3: {
    width: 300,
    height: 300,
    backgroundColor: "rgba(255, 107, 129, 0.05)",
  },
  sosRing2: {
    width: 260,
    height: 260,
    backgroundColor: "rgba(255, 107, 129, 0.12)",
  },
  sosRing1: {
    width: 210,
    height: 210,
    zIndex: 10,
  },
  sosButton: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#FF6B81",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B81",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  sosButtonActive: {
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
  },
  sosContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  sosText: {
    fontSize: 48,
    fontWeight: "400",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
  sosSubtext: {
    fontSize: 14,
    color: "rgba(241, 241, 241, 0.9)",
    marginTop: 4,
    fontWeight: "400",
    fontFamily: "Inter",
  },
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
  ekgCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    height: 180,
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
    fontSize: 13,
    color: "#666666",
    fontWeight: "500",
    marginLeft: 4,
    fontFamily: "InterMedium",
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
    backgroundColor: "#a5a5a5ff",
  },
  liveText: {
    fontSize: 12,
    color: "#B0B3BA",
    marginLeft: 4,
    fontFamily: "Inter",
  },
  ekgContainer: {
    height: 120,
    paddingHorizontal: 16,
    paddingBottom: 18,
    justifyContent: "center",
    overflow: "hidden",
  },
  ekgGrid: {
    ...StyleSheet.absoluteFillObject,
    left: 16,
    right: 16,
    top: 10,
    bottom: 18,
  },
  gridColumn: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#EEF2F6",
  },
  gridRow: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#EEF2F6",
  },
  waveTrack: {
    flexDirection: "row",
    alignItems: "center",
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  vitalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "48%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
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
    color: "#666666",
    fontWeight: "500",
    marginLeft: 4,
    fontFamily: "InterMedium",
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
    fontFamily: "InterBold",
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
  iconWrapper: {
    width: 27,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  vitalIcon: {
    width: 24,
    height: 24,
  },
});
