import { Stack } from "expo-router";
import { useAuthStore } from "@/features/auth/store/auth.store";

export default function Layout() {
  const { token } = useAuthStore();

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