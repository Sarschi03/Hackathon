import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

export function ResponderGreeting({ firstName }: { firstName: string }) {
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
      <View style={styles.iconContainer}>
        <Image
          source={require("../../assets/images/icon_black.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.name}>{firstName},</Text>
      <Text style={styles.headline}>
        Save a{"\n"}life today.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
    alignItems: "flex-start",
  },
  iconContainer: {
    width: "100%",
    height: 60,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 90,
    height: 90,
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
