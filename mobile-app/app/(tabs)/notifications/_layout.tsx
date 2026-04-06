import React from "react";
import { Stack } from "expo-router";

import { getAppStackHeaderOptions } from "@/config/headerConfig";

export default function NotificationsLayout() {
    return (
        <Stack screenOptions={getAppStackHeaderOptions()}>
            <Stack.Screen name="index" options={{ title: "Notifications" }} />
        </Stack>
    );
}
