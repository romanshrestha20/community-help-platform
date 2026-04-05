import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { useThemeStore } from "@/features/settings/store/theme.store";
import { getAccessToken, getRefreshToken, clearTokens } from "@/utils/token";
import { getMe } from "@/features/auth/api/auth.api";
export default function Layout() {
  const router = useRouter();
  const segments = useSegments();

  const { login, logout, isAuthenticated } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

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
      } catch (error) {
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

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, segments, isInitializing, router]);

  if (isInitializing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Slot />;
}

const styles = {
  loaderContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};