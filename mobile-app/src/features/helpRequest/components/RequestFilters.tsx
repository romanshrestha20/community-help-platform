// components/RequestFilters.tsx
import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Row, Stack, theme } from "@/design-system";

interface Props {
    statusFilter: string;
    setStatusFilter: (v: any) => void;
    categoryFilter: string;
    setCategoryFilter: (v: any) => void;
    sortBy: string;
    setSortBy: (v: any) => void;
}

export const RequestFilters = ({ statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, sortBy, setSortBy }: Props) => {
    const statusOptions = ["ALL", "OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"];
    const categoryOptions = ["ALL", "FOOD", "MEDICAL", "EDUCATION", "OTHER"];
    const sortOptions = ["NEWEST", "OLDEST", "MOST_BIDS"];

    return (
        <Stack gap="sm">
            <Row gap="sm" style={styles.chipRow}>
                {sortOptions.map((option) => (
                    <Pressable key={option} style={[styles.chip, sortBy === option && styles.chipActive]} onPress={() => setSortBy(option)}>
                        <Text style={[styles.chipText, sortBy === option && styles.chipTextActive]}>{option}</Text>
                    </Pressable>
                ))}
            </Row>

            <Row gap="sm" style={styles.chipRow}>
                {statusOptions.map((option) => (
                    <Pressable key={option} style={[styles.chip, statusFilter === option && styles.chipActive]} onPress={() => setStatusFilter(option)}>
                        <Text style={[styles.chipText, statusFilter === option && styles.chipTextActive]}>{option}</Text>
                    </Pressable>
                ))}
            </Row>

            <Row gap="sm" style={styles.chipRow}>
                {categoryOptions.map((option) => (
                    <Pressable key={option} style={[styles.chip, categoryFilter === option && styles.chipActive]} onPress={() => setCategoryFilter(option)}>
                        <Text style={[styles.chipText, categoryFilter === option && styles.chipTextActive]}>{option}</Text>
                    </Pressable>
                ))}
            </Row>
        </Stack>
    );
};

const styles = StyleSheet.create({
    chipRow: { flexWrap: "wrap" },
    chip: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs },
    chipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
    chipText: { color: theme.colors.textPrimary, fontSize: theme.typography.fontSize.xs, lineHeight: theme.typography.lineHeight.xs, fontWeight: theme.typography.fontWeight.medium },
    chipTextActive: { color: theme.colors.textInverse },
});