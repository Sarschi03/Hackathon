import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import type { DemoVitalsState } from "@/hooks/use-demo-vitals";

import { useLocalization } from "@/hooks/use-localization";

const { width } = Dimensions.get("window");

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

function HeartIcon({ color = "#4BAEE8" }: { color?: string }) {
  return (
    <View style={[styles.heartIconWrapper, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.heartIconText, { color }]}>♥</Text>
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
}: {
  label: string;
  value: string | number;
  unit: string;
  accentColor: string;
}) {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

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
        <View style={[styles.vitalCardBar, { backgroundColor: `${accentColor}30` }]}>
          <View
            style={[
              styles.vitalCardBarFill,
              { backgroundColor: accentColor, width: "68%" },
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
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [fadeAnim, slideAnim, sosScale]);

  const pressure = useMemo(
    () => `${vitals.systolic}/${vitals.diastolic}`,
    [vitals.diastolic, vitals.systolic],
  );

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: sosScale }], marginBottom: 28 }}>
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
          <View>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.sosText}>{hasActiveIncident ? "CANCEL" : t('home_sos')}</Text>
                {!hasActiveIncident && (
                  <Text style={styles.sosSubtext}>Hold to activate!</Text>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Animated.View>

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
        <EcgLine />
      </Animated.View>

      <View style={styles.vitalsGrid}>
        <VitalCard
          label={t('home_pulse')}
          value={vitals.heartRate ?? "98"}
          unit="br/min"
          accentColor="#4BAEE8"
        />
        <VitalCard
          label={t('home_blood_oxygen')}
          value={vitals.bloodOxygen ?? "98"}
          unit="SpO2%"
          accentColor="#4BAEE8"
        />
        <VitalCard
          label={t('home_blood_pressure')}
          value={pressure ?? "118/70"}
          unit="mmHg"
          accentColor="#4BAEE8"
        />
        <VitalCard
          label={t('home_respiratory')}
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
    gap: 8,
  },
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
