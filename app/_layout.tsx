import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useConsent } from '@/hooks/use-consent';
import ConsentScreen from '@/app/consent-screen';
import { LocalizationProvider } from '@/hooks/use-localization';
import { AppConvexProvider } from '@/components/convex-provider';
import { AppSessionProvider } from '@/hooks/use-app-session';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();


import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  // The initial route is the onboarding splash
  initialRouteName: 'onboarding',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { hasConsented, acceptConsent } = useConsent();

  const [fontsLoaded, fontError] = useFonts({
    Inter: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const content = (() => {
    if (!fontsLoaded && !fontError) {
      return null;
    }

    if (hasConsented === null) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      );
    }

    if (!hasConsented) {
      return <ConsentScreen onAccept={acceptConsent} />;
    }

    return (
      <Stack>
        {/* Onboarding flow */}
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding-slides" options={{ headerShown: false }} />

        {/* Auth */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />

        {/* Main app */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
    );
  })();

  return (
    <AppConvexProvider>
      <AppSessionProvider>
        <LocalizationProvider>
          <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            {content}
            <StatusBar style="auto" />
          </ThemeProvider>
        </LocalizationProvider>
      </AppSessionProvider>
    </AppConvexProvider>
  );
}
