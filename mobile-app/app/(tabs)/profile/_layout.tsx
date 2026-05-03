import React from "react";
import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="bids" />
            <Stack.Screen name="activity-history" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="security" />
            <Stack.Screen name="support" />
            <Stack.Screen name="requests" />
            <Stack.Screen name="requests/[id]" />
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
