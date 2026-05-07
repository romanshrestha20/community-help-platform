import React, { useEffect } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Switch, Text, useWindowDimensions, View } from "react-native";

import { AppHeader } from "@/components/ui/AppHeader";
import { Card, Screen, Stack, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useNotificationSettingsStore } from "@/features/settings/store/notification-settings.store";
import { WebSectionShell } from "@/features/web/components/WebSectionShell";
import { ProfileTabsBar } from "@/features/web/components/ProfileTabsBar";

const nearbyDistanceOptions: Array<1 | 3 | 5 | 10 | 25> = [1, 3, 5, 10, 25];
const nearbyCategoryOptions = [
    { slug: "errands", label: "Errands" },
    { slug: "moving", label: "Moving" },
    { slug: "transportation", label: "Transportation" },
    { slug: "shopping", label: "Shopping" },
] as const;

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
    const { width } = useWindowDimensions();
    const isDesktopWeb = Platform.OS === "web" && width >= 1024;
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
        nearbyAlertsEnabled,
        nearbyAlertRadiusKm,
        nearbyAlertsUrgentOnly,
        nearbyAlertCategorySlugs,
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

    const content = (
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

                    <Card>
                        <Stack gap="sm">
                            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                                Smart Nearby Alerts
                            </Text>
                            <Text style={[styles.sectionDescription, { color: palette.textSecondary }]}>
                                Get notified when new nearby requests match your radius and category preferences.
                            </Text>

                            <SettingRow
                                title="Smart nearby alerts"
                                subtitle="Turn nearby request alerts on or off."
                                value={nearbyAlertsEnabled}
                                disabled={!pushEnabled}
                                onValueChange={(value) => {
                                    void setPreference("nearbyAlertsEnabled", value);
                                }}
                            />

                            <View style={styles.preferenceBlock}>
                                <Text style={[styles.preferenceLabel, { color: palette.textPrimary }]}>
                                    Alert distance
                                </Text>
                                <View style={styles.chipWrap}>
                                    {nearbyDistanceOptions.map((distance) => {
                                        const isActive = nearbyAlertRadiusKm === distance;
                                        return (
                                            <Pressable
                                                key={distance}
                                                disabled={!pushEnabled || !nearbyAlertsEnabled}
                                                onPress={() => {
                                                    void setPreference("nearbyAlertRadiusKm", distance);
                                                }}
                                                style={[
                                                    styles.chip,
                                                    {
                                                        backgroundColor: isActive ? palette.primarySoft : palette.surfaceMuted,
                                                        borderColor: isActive ? palette.primary : palette.border,
                                                        opacity:
                                                            !pushEnabled || !nearbyAlertsEnabled
                                                                ? 0.55
                                                                : 1,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        {
                                                            color: isActive ? palette.primary : palette.textSecondary,
                                                        },
                                                    ]}
                                                >
                                                    {distance} km
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <SettingRow
                                title="Urgent only"
                                subtitle="Only notify for urgent nearby requests."
                                value={nearbyAlertsUrgentOnly}
                                disabled={!pushEnabled || !nearbyAlertsEnabled}
                                onValueChange={(value) => {
                                    void setPreference("nearbyAlertsUrgentOnly", value);
                                }}
                            />

                            <View style={styles.preferenceBlock}>
                                <Text style={[styles.preferenceLabel, { color: palette.textPrimary }]}>
                                    Categories
                                </Text>
                                <View style={styles.chipWrap}>
                                    <Pressable
                                        disabled={!pushEnabled || !nearbyAlertsEnabled}
                                        onPress={() => {
                                            void setPreference("nearbyAlertCategorySlugs", []);
                                        }}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor:
                                                    nearbyAlertCategorySlugs.length === 0
                                                        ? palette.primarySoft
                                                        : palette.surfaceMuted,
                                                borderColor:
                                                    nearbyAlertCategorySlugs.length === 0
                                                        ? palette.primary
                                                        : palette.border,
                                                opacity:
                                                    !pushEnabled || !nearbyAlertsEnabled
                                                        ? 0.55
                                                        : 1,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                {
                                                    color:
                                                        nearbyAlertCategorySlugs.length === 0
                                                            ? palette.primary
                                                            : palette.textSecondary,
                                                },
                                            ]}
                                        >
                                            All
                                        </Text>
                                    </Pressable>

                                    {nearbyCategoryOptions.map((item) => {
                                        const isActive = nearbyAlertCategorySlugs.includes(item.slug);
                                        return (
                                            <Pressable
                                                key={item.slug}
                                                disabled={!pushEnabled || !nearbyAlertsEnabled}
                                                onPress={() => {
                                                    const next = isActive
                                                        ? nearbyAlertCategorySlugs.filter((slug) => slug !== item.slug)
                                                        : [...nearbyAlertCategorySlugs, item.slug];
                                                    void setPreference("nearbyAlertCategorySlugs", next);
                                                }}
                                                style={[
                                                    styles.chip,
                                                    {
                                                        backgroundColor: isActive ? palette.primarySoft : palette.surfaceMuted,
                                                        borderColor: isActive ? palette.primary : palette.border,
                                                        opacity:
                                                            !pushEnabled || !nearbyAlertsEnabled
                                                                ? 0.55
                                                                : 1,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        {
                                                            color: isActive ? palette.primary : palette.textSecondary,
                                                        },
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
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

    if (isDesktopWeb) {
        return (
            <WebSectionShell
                activeKey="settings"
                rightPanel={
                    <View style={[styles.webPanel, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                        <Text style={[styles.webPanelTitle, { color: palette.textPrimary }]}>Notification Preferences</Text>
                        <Text style={[styles.webPanelBody, { color: palette.textSecondary }]}>
                            Configure push delivery, nearby alerts, and topic-level notification controls.
                        </Text>
                    </View>
                }
            >
                <View style={styles.webContent}>
                    <ProfileTabsBar />
                    {content}
                </View>
            </WebSectionShell>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    webContent: {
        flex: 1,
    },
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
    preferenceBlock: {
        gap: theme.spacing.xs,
    },
    preferenceLabel: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.xs,
    },
    chip: {
        borderWidth: 1,
        borderRadius: theme.radius.fill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    chipText: {
        fontSize: theme.typography.fontSize.xs + 1,
        lineHeight: theme.typography.lineHeight.xs + 2,
        fontWeight: theme.typography.fontWeight.medium,
    },
    webPanel: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        gap: 8,
    },
    webPanelTitle: {
        fontSize: 16,
        fontWeight: "800",
    },
    webPanelBody: {
        fontSize: 13,
        lineHeight: 18,
    },
});
