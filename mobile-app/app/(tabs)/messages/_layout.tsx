import React from "react";
import { Stack } from "expo-router";

export default function MessagesLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: "Messages" }} />
        </Stack>
    );
}
