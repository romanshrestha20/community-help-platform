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
            <View style={[styles.line, { backgroundColor: palette.border }]} />
            <View style={[styles.pill, { backgroundColor: palette.surfaceSecondary }]}>
                <Text style={[styles.text, { color: palette.textMuted }]}>
                    {dateFormatter.format(new Date(date))}
                </Text>
            </View>
            <View style={[styles.line, { backgroundColor: palette.border }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: theme.spacing.sm,
    },
    line: {
        flex: 1,
        height: 1,
    },
    pill: {
        borderRadius: 999,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        marginHorizontal: theme.spacing.sm,
    },
    text: {
        ...theme.typography.textStyle.caption,
    },
});

export default DateSeparator;
