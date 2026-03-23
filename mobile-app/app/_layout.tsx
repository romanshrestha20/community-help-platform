import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "home" }} />
      <Stack.Screen name="home" options={{ title: "home" }} />
      <Stack.Screen name="(auth)/login" options={{ title: "login" }} />
      <Stack.Screen name="(auth)/register" options={{ title: "register" }} />
    </Stack>
  );
}