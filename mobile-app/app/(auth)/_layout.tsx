import React from "react";
import { Stack } from "expo-router";

import { getAppStackHeaderOptions } from "@/config/headerConfig";

export default function AuthLayout() {
    return (
        <Stack screenOptions={getAppStackHeaderOptions()}>
            <Stack.Screen name="login" options={{ title: "Sign In" }} />
            <Stack.Screen name="register" options={{ title: "Create Account" }} />
        </Stack>
    );
}
