import React from "react";
import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="requests/index" />
      <Stack.Screen name="requests/map" />
      <Stack.Screen name="requests/[id]" />
      <Stack.Screen
        name="requests/create"
        options={{
          presentation: "transparentModal",
          animation: "slide_from_bottom",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="requests/[id]/edit"
        options={{
          presentation: "transparentModal",
          animation: "slide_from_bottom",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </Stack>
  );
}
