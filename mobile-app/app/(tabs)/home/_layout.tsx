import React from "react";
import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="requests/index" options={{ title: "Browse Requests" }} />
      <Stack.Screen name="requests/[id]" options={{ title: "Request Details" }} />
      <Stack.Screen name="requests/[id]/edit" options={{ title: "Edit Request" }} />
    </Stack>
  );
}