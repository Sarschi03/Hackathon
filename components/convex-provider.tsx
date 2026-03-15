import React from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { StyleSheet, Text, View } from 'react-native';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function AppConvexProvider({ children }: { children: React.ReactNode }) {
  if (!convexClient) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Convex setup needed</Text>
        <Text style={styles.body}>
          Add `EXPO_PUBLIC_CONVEX_URL` to your Expo environment before running the app.
        </Text>
        <Text style={styles.code}>
          EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
        </Text>
      </View>
    );
  }

  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7F8FA',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4D5562',
    marginBottom: 16,
  },
  code: {
    fontSize: 14,
    color: '#111111',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
