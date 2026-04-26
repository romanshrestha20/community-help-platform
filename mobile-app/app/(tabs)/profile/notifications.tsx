import React, { useEffect } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Switch, Text, View } from "react-native";

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
        registrationStatus,
        permissionStatus,
        lastRegistrationError,
        messagesEnabled,
        bidsEnabled,
        requestUpdatesEnabled,
        savedRequestsEnabled,
        initializeNotificationSettings,
        setPreference,
    } = useNotificationSettingsStore();

    const statusTitle =
        registrationStatus === "registered"
            ? "Push notifications are active"
            : registrationStatus === "requesting-permission"
                ? "Waiting for Android permission"
                : registrationStatus === "registering-token"
                    ? "Registering this device"
                    : registrationStatus === "denied"
                        ? "Android notifications are blocked"
                        : registrationStatus === "failed"
                            ? "Push setup needs attention"
                            : pushEnabled
                                ? "Push notifications are ready to register"
                                : "Push notifications are turned off";

    const statusBody =
        registrationStatus === "registered"
            ? "This Android device is registered for push delivery. System notifications should appear when messages or request updates arrive."
            : registrationStatus === "requesting-permission"
                ? "Approve the Android notification prompt to allow system notifications."
                : registrationStatus === "registering-token"
                    ? "The app is requesting an Expo push token and syncing it with the backend."
                    : registrationStatus === "denied"
                        ? "Android permission was denied, so system notifications cannot be shown until you re-enable them in Settings."
                        : registrationStatus === "failed"
                            ? lastRegistrationError ?? "Push registration failed before the device could be registered."
                            : pushEnabled
                                ? "Push will register after Android permission is granted on a physical device."
                                : "Turn on the master switch to register this device for push notifications.";

    const canOpenSettings =
        registrationStatus === "denied" || permissionStatus === "denied";

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
                                Enable push on this device, then allow the Android system prompt when it appears.
                                Push delivery works on a physical Android device with a development or signed build
                                that supports Expo notifications.
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

                    <Pressable
                        style={[
                            styles.helperCard,
                            {
                                backgroundColor:
                                    registrationStatus === "registered"
                                        ? palette.primarySoft
                                        : palette.surfaceMuted,
                                borderColor:
                                    registrationStatus === "denied" || registrationStatus === "failed"
                                        ? palette.warning
                                        : palette.border,
                            },
                        ]}
                        disabled={!canOpenSettings}
                        onPress={() => {
                            if (canOpenSettings) {
                                void Linking.openSettings();
                            }
                        }}
                    >
                        <Text style={[styles.helperTitle, { color: palette.textPrimary }]}>
                            {statusTitle}
                        </Text>
                        <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                            {statusBody}
                        </Text>
                        {canOpenSettings ? (
                            <Text style={[styles.helperAction, { color: palette.primary }]}>
                                Open Android settings
                            </Text>
                        ) : null}
                    </Pressable>

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
                            How delivery works
                        </Text>
                        <Text style={[styles.helperText, { color: palette.textSecondary }]}>
                            The master switch controls device registration. The activity toggles filter which
                            foreground banners, badges, and server notifications remain visible in the app.
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
    helperAction: {
        fontSize: theme.typography.fontSize.xs + 1,
        lineHeight: theme.typography.lineHeight.xs + 3,
        fontWeight: theme.typography.fontWeight.semibold,
    },
});
