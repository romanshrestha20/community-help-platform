import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Slot, useRouter, useSegments } from "expo-router";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { useThemeStore } from "@/features/settings/store/theme.store";
import { getAccessToken, getRefreshToken, clearTokens } from "@/utils/token";
import { getMe } from "@/features/auth/api/auth.api";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/utils/toastConfig";
import { configureToast } from "@/utils/toast";
import { enableScreens } from "react-native-screens";
import { usePushNotifications } from "../src/features/notifications/hooks/usePushNotifications";

// Temporary iOS Expo Go workaround: bypass native RNSScreen host views.
enableScreens(false);

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { login, logout, isAuthenticated } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  usePushNotifications();

  useEffect(() => {
    if (!fontsLoaded) return;
    // Temporarily skip global defaultProps mutation to avoid Fabric host prop issues.
    // Keep typography controlled through explicit component styles/design-system tokens.

    configureToast({
      position: "top",
      duration: 3000,
      errorDuration: 4200,
    });
  }, [fontsLoaded]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await useThemeStore.getState().initializeThemeMode();

        const [storedAccessToken, storedRefreshToken] = await Promise.all([
          getAccessToken(),
          getRefreshToken(),
        ]);

        if (!storedAccessToken || !storedRefreshToken) {
          logout();
          return;
        }

        const result = await getMe();

        if (!result.success || !result.data) {
          await clearTokens();
          logout();
          return;
        }

        login({
          user: result.data,
          accessToken: storedAccessToken,
          refreshToken: storedRefreshToken,
        });
      } catch {
        await clearTokens();
        logout();
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [login, logout]);

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isRootRoute = segments[0] === "index";

    if (isAuthenticated && isRootRoute) {
      router.replace("/(tabs)/home");
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, segments, isInitializing, router]);

  if (isInitializing || !fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
}

const styles = {
  loaderContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};