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
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from "@/features/auth/store/auth.store";
import { canAccessAdminScreen } from "@/features/auth/utils/authz";
import { useThemeStore } from "@/features/settings/store/theme.store";
import { getAccessToken, getRefreshToken, clearTokens } from "@/utils/token";
import { getMe } from "@/features/auth/api/auth.api";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/utils/toastConfig";
import { configureToast } from "@/utils/toast";
import { enableScreens } from "react-native-screens";
import { usePushNotifications } from "../src/features/notifications/hooks/usePushNotifications";
import { useFavorites } from "@/features/favorites/hooks/favorite.hook";
import { TamaguiProvider } from "tamagui";
import appTamaguiConfig from "../tamagui.config";

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

  const { login, logout, isAuthenticated, user } = useAuthStore();
  const { loadFavoriteIds, clearFavorites } = useFavorites();
  const [isInitializing, setIsInitializing] = useState(true);

  const requiresOnboarding = Boolean(
    isAuthenticated &&
      user &&
      ((!user.fullName && !user.profile?.fullName) ||
        !user.profile?.address)
  );

  usePushNotifications();
  // Set the animation options. This is optional.
  SplashScreen.setOptions({
    duration: 1000,
    fade: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    void import("expo-web-browser")
      .then((WebBrowser) => {
        WebBrowser.maybeCompleteAuthSession?.();
      })
      .catch(() => {
        // Ignore when the native web browser module is not present in the current build.
      });
  }, []);

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

    const routeSegments = segments as string[];
    const inAuthGroup = routeSegments[0] === "(auth)";
    const isRootRoute = routeSegments[0] === "index";
    const isOAuthRedirectRoute = routeSegments[0] === "oauthredirect";
    const isAdminRoute = routeSegments[0] === "admin";
    const authLeafRoute = routeSegments[1] ?? "";
    const isCompleteProfileRoute =
      inAuthGroup && authLeafRoute === "complete-profile";
    const isWelcomeRoute = inAuthGroup && authLeafRoute === "welcome";
    const allowAuthenticatedAuthRoutes = new Set([
      "forgot-password",
      "reset-password",
      "verify-email",
      "verify-phone",
      "welcome",
      "complete-profile",
    ]);

    if (isAuthenticated && isRootRoute) {
      router.replace("/(tabs)/home");
      return;
    }

    if (isOAuthRedirectRoute) {
      return;
    }

    if (!isAuthenticated && !inAuthGroup && !isRootRoute) {
      router.replace("/(auth)/login");
      return;
    }

    if (isAuthenticated && isAdminRoute && !canAccessAdminScreen(user)) {
      router.replace("/(tabs)/home");
      return;
    }

    if (requiresOnboarding && !isCompleteProfileRoute && !isWelcomeRoute) {
      router.replace("/(auth)/complete-profile");
      return;
    }

    if (
      isAuthenticated &&
      inAuthGroup &&
      !allowAuthenticatedAuthRoutes.has(authLeafRoute)
    ) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, isInitializing, requiresOnboarding, router, segments, user]);

  useEffect(() => {
    if (isInitializing) return;

    const canLoadFavorites = Boolean(
      isAuthenticated && user && user.isEmailVerified
    );

    if (!canLoadFavorites) {
      clearFavorites();
      return;
    }

    void loadFavoriteIds();
  }, [clearFavorites, isAuthenticated, isInitializing, loadFavoriteIds, user]);

  if (isInitializing || !fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  return (

    <TamaguiProvider config={appTamaguiConfig} defaultTheme="light">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Slot />
        <Toast config={toastConfig} />
      </GestureHandlerRootView>
    </TamaguiProvider>
  );
}

const styles = {
  loaderContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};
