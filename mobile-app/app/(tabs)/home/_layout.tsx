import React from "react";
import { Stack } from "expo-router";

import { getAppStackHeaderOptions } from "@/config/headerConfig";

export default function HomeLayout() {
  return (
    <Stack screenOptions={getAppStackHeaderOptions()}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="requests/new" options={{ title: "Create Request" }} />
      <Stack.Screen name="requests/index" options={{ title: "Browse Requests" }} />
      <Stack.Screen name="requests/[id]" options={{ title: "Request Details" }} />
      <Stack.Screen name="requests/[id]/edit" options={{ title: "Edit Request" }} />
    </Stack>
  );
}