import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, View } from 'react-native';
import { useConsent } from '@/hooks/use-consent';
import ConsentScreen from '@/app/consent-screen';
import { AppConvexProvider } from '@/components/convex-provider';
import { AppSessionProvider } from '@/hooks/use-app-session';


import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  // The initial route is the onboarding splash
  initialRouteName: 'onboarding',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { hasConsented, acceptConsent } = useConsent();

  if (hasConsented === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
    }

  if (!hasConsented) {
    return <ConsentScreen onAccept={acceptConsent} />;
  }

  return (
    <AppConvexProvider>
      <AppSessionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            {/* Onboarding flow */}
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding-slides" options={{ headerShown: false }} />

            {/* Auth */}
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />

            {/* Main app */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AppSessionProvider>
    </AppConvexProvider>
  );
}
