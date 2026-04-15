import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Screen, Stack, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useNotificationSettingsStore } from "@/features/settings/store/notification-settings.store";

type SettingRowProps = {
    title: string;
    subtitle: string;
    value: boolean;
    disabled?: boolean;
    onValueChange: (value: boolean) => void;
};

const SettingRow = ({
    title,
    subtitle,
    value,
    disabled = false,
    onValueChange,
}: SettingRowProps) => {
    const { palette } = useThemeContext();

    return (
        <View
            style={[
                styles.settingRow,
                {
                    borderBottomColor: palette.border,
                    opacity: disabled ? 0.55 : 1,
                },
            ]}
        >
            <View style={styles.settingCopy}>
                <Text style={[styles.settingTitle, { color: palette.textPrimary }]}>
                    {title}
                </Text>
                <Text style={[styles.settingSubtitle, { color: palette.textSecondary }]}>
                    {subtitle}
                </Text>
            </View>

            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{
                    false: palette.border,
                    true: palette.primarySoft,
                }}
                thumbColor={value ? palette.primary : palette.surface}
            />
        </View>
    );
};

export default function NotificationSettingsScreen() {
    const { palette } = useThemeContext();
    const {
        isHydrated,
        pushEnabled,
        messagesEnabled,
        bidsEnabled,
        requestUpdatesEnabled,
        savedRequestsEnabled,
        initializeNotificationSettings,
        setPreference,
    } = useNotificationSettingsStore();

    useEffect(() => {
        void initializeNotificationSettings();
    }, [initializeNotificationSettings]);

    return (
        <Screen>
            <AppHeader
                title="Notification Settings"
                subtitle="Choose which activity you want to hear about."
                showBackButton
                backButtonProps={{
                    fallback: APP_ROUTES.PROFILE,
                    variant: "secondary",
                }}
            />

            {!isHydrated ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator color={palette.primary} />
                </View>
            ) : (
                <Stack gap="md">
                    <Card>
                        <Stack gap="sm">
                            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                                Delivery
                            </Text>
                            <Text style={[styles.sectionDescription, { color: palette.textSecondary }]}>
                                This first step stores your notification preferences inside the app.
                                Push registration and server-side filtering can be wired in next.
                            </Text>

                            <SettingRow
                                title="Push notifications"
                                subtitle="Enable alerts on your device."
                                value={pushEnabled}
                                onValueChange={(value) => {
                                    void setPreference("pushEnabled", value);
                                }}
                            />
                        </Stack>
                    </Card>

                    <Card>
                        <Stack gap="sm">
                            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                                Activity Types
                            </Text>
                            <Text style={[styles.sectionDescription, { color: palette.textSecondary }]}>
                                Fine-tune which kinds of app activity should trigger notifications.
                            </Text>

                            <SettingRow
                                title="Messages"
                                subtitle="New conversation messages and replies."
                                value={messagesEnabled}
                                disabled={!pushEnabled}
                                onValueChange={(value) => {
                                    void setPreference("messagesEnabled", value);
                                }}
                            />

                            <SettingRow
                                title="Bids"
                                subtitle="Incoming bids plus accepted or rejected offers."
                                value={bidsEnabled}
                                disabled={!pushEnabled}
                                onValueChange={(value) => {
                                    void setPreference("bidsEnabled", value);
                                }}
                            />

                            <SettingRow
                                title="Request updates"
                                subtitle="Assigned, completed, or cancelled request changes."
                                value={requestUpdatesEnabled}
                                disabled={!pushEnabled}
                                onValueChange={(value) => {
                                    void setPreference("requestUpdatesEnabled", value);
                                }}
                            />

                            <SettingRow
                                title="Saved requests"
                                subtitle="Updates related to requests you saved for later."
                                value={savedRequestsEnabled}
                                disabled={!pushEnabled}
                                onValueChange={(value) => {
                                    void setPreference("savedRequestsEnabled", value);
                                }}
                            />
                        </Stack>
                    </Card>

                    <Pressable
                        style={[
                            styles.helperCard,
                            {
                                backgroundColor: palette.surfaceMuted,
                                borderColor: palette.border,
                            },
                        ]}
                    >
                        <Text style={[styles.helperTitle, { color: palette.textPrimary }]}>
                            Next step
                        </Text>
                        <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                            Wire the master switch into push-token registration and use these toggles
                            to filter which notifications are surfaced.
                        </Text>
                    </Pressable>
                </Stack>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    loaderWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.md,
        lineHeight: theme.typography.lineHeight.md,
        fontWeight: theme.typography.fontWeight.bold,
    },
    sectionDescription: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
    },
    settingRow: {
        minHeight: 72,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderBottomWidth: 1,
    },
    settingCopy: {
        flex: 1,
        gap: theme.spacing.xxs,
    },
    settingTitle: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    settingSubtitle: {
        fontSize: theme.typography.fontSize.xs + 1,
        lineHeight: theme.typography.lineHeight.xs + 2,
    },
    helperCard: {
        borderWidth: 1,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        gap: theme.spacing.xs,
    },
    helperTitle: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    helperText: {
        fontSize: theme.typography.fontSize.xs + 1,
        lineHeight: theme.typography.lineHeight.xs + 3,
    },
});
