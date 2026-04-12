
import { Stack } from "@/design-system";
import { theme } from "@/design-system/theme";
import React from "react";
import { Text } from "react-native";


const InboxEmptyState: React.FC = () => (
    <Stack gap="sm" style={{ alignItems: "center", justifyContent: "center", padding: theme.spacing.xxl }}>
        <Text style={{ fontSize: theme.typography.fontSize.lg, fontWeight: "bold", marginBottom: theme.spacing.xs }}>
            No conversations yet.
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
            Start helping or requesting to begin a chat!
        </Text>
    </Stack>
);

export default InboxEmptyState;
