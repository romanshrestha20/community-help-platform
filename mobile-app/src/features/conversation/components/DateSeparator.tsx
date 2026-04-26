import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface DateSeparatorProps {
    date: string;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
});

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
    const { palette } = useThemeContext();

    return (
        <View style={styles.container}>
            <Text style={[styles.text, { color: palette.textMuted }]}>
                {dateFormatter.format(new Date(date))}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        marginVertical: theme.spacing.md,
    },
    text: {
        ...theme.typography.textStyle.caption,
    },
});

export default DateSeparator;
