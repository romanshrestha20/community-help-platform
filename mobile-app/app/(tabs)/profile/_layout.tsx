import React from "react";
import { Stack } from "expo-router";

import { getAppStackHeaderOptions } from "@/config/headerConfig";

export default function ProfileLayout() {
    return (
        <Stack screenOptions={getAppStackHeaderOptions()}>
            <Stack.Screen name="index" options={{ title: "Profile" }} />
            <Stack.Screen name="requests" options={{ title: "My Requests" }} />
        </Stack>
    );
}