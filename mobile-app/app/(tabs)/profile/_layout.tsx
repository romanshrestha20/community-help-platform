import React from "react";
import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: "Profile" }} />
            <Stack.Screen name="requests" options={{ title: "My Requests" }} />
            <Stack.Screen name="bids" options={{ title: "My Bids" }} />
        </Stack>
    );
}