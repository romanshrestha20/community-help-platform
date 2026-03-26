import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { getAccessToken } from "@/utils/token";

export default function Layout() {
  const { token } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const hydrateAuth = async () => {
      try {
        const storedToken = await getAccessToken();
        if (storedToken && !useAuthStore.getState().token) {
          useAuthStore.setState({ token: storedToken, isAuthenticated: true });
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    hydrateAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isInitializing) return null;

  return (
    <Stack>
      {/* Public Routes */}
      {!token && (
        <>
          <Stack.Screen name="(auth)/login" options={{ title: "Login" }} />
          <Stack.Screen name="(auth)/register" options={{ title: "Register" }} />
        </>
      )}

      {/* Protected Routes */}
      {token && (
        <>
          <Stack.Screen name="index" options={{ title: "Home" }} />
          <Stack.Screen name="home" options={{ title: "Home" }} />
          <Stack.Screen name="profile" options={{ title: "Profile" }} />
        </>
      )}
    </Stack>
  );
}