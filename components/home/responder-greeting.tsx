import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useLocalization } from "@/hooks/use-localization";

export function ResponderGreeting({ firstName }: { firstName: string }) {
  const { t } = useLocalization();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.logoWrapper}>
          <Image
            source={require("../../assets/images/icon_black.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={styles.settingsIcon}
        >
          <Ionicons name="settings-outline" size={28} color="#1A1C22" />
        </Pressable>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.name}>{t("responder_greeting", { name: firstName })}</Text>
        <Text style={styles.headline}>
          {t("responder_headline")}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 24,
    position: "relative",
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 90,
    height: 90,
  },
  settingsIcon: {
    position: "absolute",
    right: 0,
    top: -10,
    padding: 8,
    opacity: 0.7,
  },
  textContainer: {
    alignItems: "flex-start",
  },
  name: {
    fontSize: 17,
    color: "#B0B3BA",
    fontWeight: "400",
    marginBottom: 4,
    fontFamily: "Inter",
    textAlign: "left",
  },
  headline: {
    fontSize: 32,
    fontWeight: "600",
    color: "#1A1C22",
    lineHeight: 40,
    fontFamily: "InterSemiBold",
    textAlign: "left",
  },
});
