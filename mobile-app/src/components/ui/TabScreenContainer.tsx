/**
 * Tab Screen Container
 * Wrapper component for tab screens to prevent content being hidden behind tab bar
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface TabScreenContainerProps {
    children: React.ReactNode;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingBottom: 80, // Account for tab bar height + safe area
    },
});

/**
 * Wrapper for tab screen content
 * Adds proper padding to prevent content from hiding behind the tab bar
 */
export const TabScreenContainer: React.FC<TabScreenContainerProps> = ({ children }) => {
    const { colors } = useThemeContext();

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.content}>{children}</View>
        </View>
    );
};
