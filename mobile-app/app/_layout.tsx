// app/_layout.tsx

import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { getAccessToken } from "@/utils/token";
import { ActivityIndicator, View } from "react-native";

export default function Layout() {
  const { token } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const storedToken = await getAccessToken();

      if (storedToken && !useAuthStore.getState().token) {
        useAuthStore.setState({
          token: storedToken,
          isAuthenticated: true,
        });
      }

      if (isMounted) setIsInitializing(false);
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!token && !inAuthGroup) {
      router.replace("/(auth)/login");
    }

    if (token && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [token, segments, isInitializing, router]);

  if (isInitializing) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    );
  }

  return <Slot />;
}