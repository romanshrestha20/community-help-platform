import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

export function getAppStackHeaderOptions(): NativeStackNavigationOptions {
    return {
        headerShown: false,
    };
}