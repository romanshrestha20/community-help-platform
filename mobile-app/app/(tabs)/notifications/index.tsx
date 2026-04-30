import React from "react";
import {
    Pressable,
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { AppButton } from "@/components/ui/AppButton";
import { TabScreenContainer } from "@/components/ui/TabScreenContainer";
import { Card, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { AppNotification } from "@/features/notifications/types/notification.types";
import { router } from "expo-router";

type NotificationFilter = "all" | "unread";

type NotificationSection = {
    title: string;
    data: AppNotification[];
};

type NotificationVisuals = {
    icon: keyof typeof Ionicons.glyphMap;
    tint: string;
    background: string;
    priority: "high" | "medium" | "low";
};

const getNotificationVisuals = (item: AppNotification, palette: ReturnType<typeof useThemeContext>["palette"]): NotificationVisuals => {
    const nearbyType = item.data && typeof item.data === "object" ? (item.data.nearbyType as string | undefined) : undefined;

    switch (item.type) {
        case "BID_RECEIVED":
            return { icon: "pricetag", tint: palette.primary, background: palette.primarySoft, priority: "medium" };
        case "BID_ACCEPTED":
            return { icon: "checkmark-circle", tint: palette.success, background: palette.successSoft ?? palette.surfaceMuted, priority: "high" };
        case "BID_REJECTED":
            return { icon: "close-circle", tint: palette.danger, background: palette.dangerSoft, priority: "medium" };
        case "URGENT_REQUEST_NEARBY":
            return { icon: "warning", tint: palette.danger, background: palette.dangerSoft, priority: "high" };
        case "REQUEST_NEARBY":
            return { icon: "navigate", tint: palette.primary, background: palette.primarySoft, priority: "medium" };
        case "REQUEST_ASSIGNED":
            return { icon: "clipboard", tint: palette.secondary, background: palette.secondarySoft, priority: "medium" };
        case "REQUEST_COMPLETED":
            return { icon: "checkmark-done", tint: palette.success, background: palette.successSoft ?? palette.surfaceMuted, priority: "medium" };
        case "REQUEST_CANCELLED":
            return { icon: "ban", tint: palette.danger, background: palette.dangerSoft, priority: "low" };
        case "MESSAGE_RECEIVED":
            return { icon: "chatbubble-ellipses", tint: palette.secondary, background: palette.secondarySoft, priority: "medium" };
        case "REVIEW_RECEIVED":
        case "REVIEW_REPLY_RECEIVED":
            return { icon: "star", tint: palette.accent, background: palette.accentSoft, priority: "low" };
        case "SYSTEM":
            if (nearbyType === "URGENT_REQUEST_NEARBY") {
                return { icon: "warning", tint: palette.danger, background: palette.dangerSoft, priority: "high" };
            }
            if (nearbyType === "REQUEST_NEARBY") {
                return { icon: "navigate", tint: palette.primary, background: palette.primarySoft, priority: "medium" };
            }
            return { icon: "notifications", tint: palette.textSecondary, background: palette.surfaceMuted, priority: "low" };
        default:
            return { icon: "notifications", tint: palette.textSecondary, background: palette.surfaceMuted, priority: "low" };
    }
};

const getActorName = (item: AppNotification) => {
    return item.actor?.profile.fullName?.trim() || item.actor?.email || "Someone";
};

const getNotificationCopy = (item: AppNotification) => {
    const actor = getActorName(item);
    const title = item.request?.title?.trim() || item.title;
    const nearbyType = item.data && typeof item.data === "object" ? (item.data.nearbyType as string | undefined) : undefined;

    switch (item.type) {
        case "BID_RECEIVED":
            return {
                primary: `${actor} placed a bid`,
                secondary: `"${title}"`,
            };
        case "BID_ACCEPTED":
            return {
                primary: "Bid accepted",
                secondary: title,
            };
        case "BID_REJECTED":
            return {
                primary: `${actor} rejected your bid`,
                secondary: `"${title}"`,
            };
        case "REQUEST_ASSIGNED":
            return {
                primary: `${actor} assigned the request`,
                secondary: `"${title}"`,
            };
        case "REQUEST_COMPLETED":
            return {
                primary: `${actor} completed the request`,
                secondary: `"${title}"`,
            };
        case "REQUEST_CANCELLED":
            return {
                primary: `${actor} cancelled the request`,
                secondary: `"${title}"`,
            };
        case "REQUEST_NEARBY":
            return {
                primary: "New request nearby",
                secondary: item.request?.title ?? item.body,
            };
        case "URGENT_REQUEST_NEARBY":
            return {
                primary: "Urgent request nearby",
                secondary: item.request?.title ?? item.body,
            };
        case "MESSAGE_RECEIVED":
            return {
                primary: actor,
                secondary: item.body || "New message",
            };
        case "REVIEW_RECEIVED":
            return {
                primary: `${actor} left a review`,
                secondary: title,
            };
        case "REVIEW_REPLY_RECEIVED":
            return {
                primary: `${actor} replied to your review`,
                secondary: title,
            };
        case "SYSTEM":
            if (nearbyType === "REQUEST_NEARBY") {
                return {
                    primary: "New request nearby",
                    secondary: item.request?.title ?? item.body,
                };
            }
            if (nearbyType === "URGENT_REQUEST_NEARBY") {
                return {
                    primary: "Urgent request nearby",
                    secondary: item.request?.title ?? item.body,
                };
            }
            return {
                primary: item.title,
                secondary: item.body,
            };
        default:
            return {
                primary: item.title,
                secondary: item.body,
            };
    }
};

const getNotificationActionLabel = (item: AppNotification) => {
    switch (item.type) {
        case "MESSAGE_RECEIVED":
            return "Reply";
        case "BID_ACCEPTED":
            return "View request";
        case "BID_RECEIVED":
            return "Open bid";
        case "REQUEST_ASSIGNED":
        case "REQUEST_COMPLETED":
        case "REQUEST_CANCELLED":
            return "View";
        case "REQUEST_NEARBY":
        case "URGENT_REQUEST_NEARBY":
            return "View request";
        default:
            return "Open";
    }
};

const getNotificationTypeLabel = (type: AppNotification["type"]) => {
    if (type === "MESSAGE_RECEIVED") return "Message";
    if (type === "BID_ACCEPTED" || type === "BID_RECEIVED" || type === "BID_REJECTED") return "Bid";
    if (type.startsWith("REQUEST_")) return "Request";
    if (type.startsWith("REVIEW_")) return "Review";
    return "System";
};

const getNotificationDestination = (item: AppNotification) => {
    if (item.type === "MESSAGE_RECEIVED") {
        return "/messages";
    }

    if (item.type === "BID_RECEIVED" && item.requestId) {
        return APP_ROUTES.PROFILE_REQUEST_DETAILS(item.requestId);
    }

    if (item.type === "BID_ACCEPTED") {
        return item.requestId
            ? APP_ROUTES.HOME_REQUEST_DETAILS(item.requestId)
            : APP_ROUTES.PROFILE_BIDS;
    }

    if (item.type === "BID_REJECTED") {
        return item.requestId
            ? APP_ROUTES.HOME_REQUEST_DETAILS(item.requestId)
            : APP_ROUTES.PROFILE_BIDS;
    }

    if (item.type === "REQUEST_NEARBY" || item.type === "URGENT_REQUEST_NEARBY") {
        return item.requestId ? APP_ROUTES.HOME_REQUEST_DETAILS(item.requestId) : APP_ROUTES.HOME_REQUESTS;
    }

    if (
        item.type === "REQUEST_ASSIGNED" ||
        item.type === "REQUEST_COMPLETED" ||
        item.type === "REQUEST_CANCELLED"
    ) {
        return item.requestId ? APP_ROUTES.HOME_REQUEST_DETAILS(item.requestId) : APP_ROUTES.HOME_REQUESTS;
    }

    if (item.requestId) {
        return APP_ROUTES.PROFILE_REQUEST_DETAILS(item.requestId);
    }

    return null;
};

const formatTime = (value: string) => {
    const date = new Date(value);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (minutes < 1) {
        return "Just now";
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    if (minutes < 24 * 60) {
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    }

    return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
    });
};

const isSameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    headerShell: {
        gap: theme.spacing.sm,
        paddingTop: theme.spacing.xxs,
    },
    heroCard: {
        overflow: "hidden",
        paddingVertical: theme.spacing.sm,
    },
    heroTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    heroIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },
    heroTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        letterSpacing: theme.typography.letterSpacing.tighter,
    },
    heroSubtitle: {
        fontSize: 13,
        lineHeight: 18,
    },
    controlRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.xs,
    },
    segmentRow: {
        flexDirection: "row",
        backgroundColor: "transparent",
        gap: 4,
    },
    segmentChip: {
        minHeight: 32,
        minWidth: 72,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    segmentLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        letterSpacing: theme.typography.letterSpacing.normal,
    },
    badge: {
        minWidth: 24,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
        alignItems: "center",
    },
    markAllTextBtn: {
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    markAllText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    emptyTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    placeholder: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        textAlign: "center",
        maxWidth: 280,
    },
    notificationCard: {
        width: "100%",
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.xs,
        borderRadius: theme.radius.lg,
    },
    notificationTouchArea: {
        width: "100%",
    },
    swipeActionsRow: {
        flexDirection: "row",
        alignItems: "stretch",
        justifyContent: "flex-end",
        gap: theme.spacing.xs,
    },
    swipeActionButton: {
        minWidth: 88,
        height: "100%",
        borderRadius: theme.radius.lg,
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: theme.spacing.sm,
    },
    swipeActionLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    notificationHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    notificationHeaderLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    iconPill: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    notificationPrimary: {
        flex: 1,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
        letterSpacing: theme.typography.letterSpacing.tighter,
    },
    notificationPrimaryRead: {
        fontWeight: theme.typography.fontWeight.medium,
    },
    notificationSecondary: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.xs,
    },
    metaRowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        flex: 1,
    },
    metaText: {
        fontSize: theme.typography.fontSize.xs,
    },
    metaInline: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
    },
    unreadDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    actionInline: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    actionInlineText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    sectionHeader: {
        marginTop: theme.spacing.xxs,
        marginBottom: theme.spacing.xxs,
        paddingHorizontal: theme.spacing.xxs,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        letterSpacing: theme.typography.letterSpacing.wide,
        textTransform: "uppercase",
    },
    emptyState: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
        gap: theme.spacing.sm,
    },
    emptyIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyActions: {
        width: "100%",
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xxs,
    },
});

export default function NotificationsScreen() {
    const { palette } = useThemeContext();
    const [filter, setFilter] = React.useState<NotificationFilter>("all");
    const {
        notifications,
        unreadCount,
        loading,
        refreshing,
        error,
        actionLoadingId,
        reload,
        markRead,
        markUnread,
        markAllRead,
        removeNotification,
    } = useNotifications();

    const filteredNotifications = React.useMemo(() => {
        return filter === "unread"
            ? notifications.filter((item) => !item.isRead)
            : notifications;
    }, [filter, notifications]);

    const sections = React.useMemo<NotificationSection[]>(() => {
        const today: AppNotification[] = [];
        const earlier: AppNotification[] = [];
        const now = new Date();

        filteredNotifications.forEach((item) => {
            const itemDate = new Date(item.createdAt);
            if (isSameDay(itemDate, now)) {
                today.push(item);
            } else {
                earlier.push(item);
            }
        });

        return [
            { title: "Today", data: today },
            { title: "Earlier", data: earlier },
        ].filter((section) => section.data.length > 0);
    }, [filteredNotifications]);

    const openNotification = React.useCallback(
        (item: AppNotification) => {
            const destination = getNotificationDestination(item);

            if (!item.isRead) {
                void markRead(item.id);
            }

            if (destination) {
                router.push(destination as never);
            }
        },
        [markRead]
    );

    const renderNotification = ({ item }: { item: AppNotification }) => {
        const isUnread = !item.isRead;
        const isLoading = actionLoadingId === item.id;
        const visuals = getNotificationVisuals(item, palette);
        const copy = getNotificationCopy(item);
        const isBidReceived = item.type === "BID_RECEIVED";

        const handleDelete = () => {
            void removeNotification(item.id);
        };

        const handleMessage = () => {
            if (!item.isRead) {
                void markRead(item.id);
            }

            if (item.conversationId) {
                router.push(`/messages/chat?conversationId=${item.conversationId}` as never);
                return;
            }

            if (item.requestId) {
                router.push(`/messages/chat?requestId=${item.requestId}` as never);
                return;
            }

            router.push("/messages" as never);
        };

        const renderRightActions = () => (
            <View
                style={[
                    styles.swipeActionsRow,
                    { paddingLeft: theme.spacing.xs },
                ]}
            >
                {isBidReceived ? (
                    <Pressable
                        onPress={handleMessage}
                        style={({ pressed }) => [
                            styles.swipeActionButton,
                            {
                                backgroundColor: palette.secondary,
                                opacity: pressed ? 0.92 : 1,
                            },
                        ]}
                    >
                        <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={18}
                            color={palette.textInverse}
                        />
                        <Text
                            style={[
                                styles.swipeActionLabel,
                                { color: palette.textInverse },
                            ]}
                        >
                            Message
                        </Text>
                    </Pressable>
                ) : null}

                <Pressable
                    onPress={handleDelete}
                    style={({ pressed }) => [
                        styles.swipeActionButton,
                        {
                            backgroundColor: palette.danger,
                            opacity: pressed ? 0.92 : 1,
                        },
                    ]}
                >
                    <Ionicons
                        name="trash-outline"
                        size={18}
                        color={palette.textInverse}
                    />
                    <Text
                        style={[
                            styles.swipeActionLabel,
                            { color: palette.textInverse },
                        ]}
                    >
                        Delete
                    </Text>
                </Pressable>
            </View>
        );

        return (
            <ReanimatedSwipeable
                overshootRight={false}
                renderRightActions={renderRightActions}
            >
                <Pressable
                    onPress={() => openNotification(item)}
                    android_ripple={{ color: palette.overlay }}
                    style={({ pressed }) => [
                        styles.notificationTouchArea,
                        {
                            opacity: isLoading ? 0.7 : 1,
                            transform: [{ scale: pressed ? 0.995 : 1 }],
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.notificationCard,
                            {
                                backgroundColor:
                                    visuals.priority === "high"
                                        ? (palette.successSoft ?? palette.surfaceSecondary)
                                        : isUnread
                                            ? palette.surfaceSecondary
                                            : palette.surface,
                                borderColor:
                                    visuals.priority === "high"
                                        ? palette.success
                                        : isUnread
                                            ? palette.primarySoft
                                            : palette.border,
                                borderWidth: 1,
                            },
                        ]}
                    >
                        <View style={styles.notificationHeader}>
                            <View style={styles.notificationHeaderLeft}>
                                <View style={[styles.iconPill, { backgroundColor: visuals.background }]}>
                                    <Ionicons name={visuals.icon} size={19} color={visuals.tint} />
                                </View>
                                <View style={{ flex: 1, gap: theme.spacing.xxs }}>
                                    <View style={styles.metaInline}>
                                        {isUnread ? <View style={[styles.unreadDot, { backgroundColor: palette.primary }]} /> : null}
                                        <Text
                                            style={[
                                                styles.notificationPrimary,
                                                { color: palette.textPrimary },
                                                !isUnread ? styles.notificationPrimaryRead : null,
                                            ]}
                                            numberOfLines={2}
                                        >
                                            {copy.primary}
                                        </Text>
                                    </View>
                                    <Text style={[styles.notificationSecondary, { color: palette.textSecondary }]} numberOfLines={2}>
                                        {copy.secondary}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.metaRow}>
                            <View style={styles.metaRowLeft}>
                                {!isUnread ? (
                                    <Pressable
                                        onPress={(event) => {
                                            event.stopPropagation();
                                            void markUnread(item.id);
                                        }}
                                        hitSlop={10}
                                        disabled={isLoading}
                                        style={({ pressed }) => [{ opacity: pressed ? 0.55 : 0.7 }]}
                                    >
                                        <Ionicons name="mail-outline" size={15} color={palette.textSecondary} />
                                    </Pressable>
                                ) : null}
                                <Text style={[styles.metaText, { color: palette.textMuted }]}>
                                    {formatTime(item.createdAt)}
                                </Text>
                                <Text style={[styles.metaText, { color: palette.textMuted }]}>•</Text>
                                <View
                                    style={[
                                        styles.badge,
                                        {
                                            backgroundColor: palette.surfaceMuted,
                                            borderWidth: 1,
                                            borderColor: palette.border,
                                            opacity: 0.72,
                                        },
                                    ]}
                                >
                                    <Text style={{ color: palette.textSecondary, fontSize: 10, fontWeight: theme.typography.fontWeight.semibold }} numberOfLines={1}>
                                        {getNotificationTypeLabel(item.type)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.actionInline}>
                                <Text style={[styles.actionInlineText, { color: palette.primary }]}>
                                    {getNotificationActionLabel(item)}
                                </Text>
                                <Ionicons name="chevron-forward" size={14} color={palette.primary} />
                            </View>
                        </View>
                    </View>
                </Pressable>
            </ReanimatedSwipeable>
        );
    };

    const renderSectionHeader = ({ section }: { section: NotificationSection }) => {
        return (
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>{section.title}</Text>
            </View>
        );
    };

    return (
        <TabScreenContainer>
            <SectionList
                contentContainerStyle={styles.container}
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void reload()} />}
                stickySectionHeadersEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: theme.spacing.xs }} />}
                SectionSeparatorComponent={() => <View style={{ height: theme.spacing.xxs }} />}
                renderSectionHeader={renderSectionHeader}
                ListHeaderComponent={
                    <View style={styles.headerShell}>
                        <Card style={[styles.heroCard, { backgroundColor: palette.surface }]}>
                            <View style={styles.heroTopRow}>
                                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                                    <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>Notifications</Text>
                                    <Text style={[styles.heroSubtitle, { color: palette.textSecondary }]}>
                                        {unreadCount > 0
                                            ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                                            : "You’re all caught up"}
                                    </Text>
                                </View>
                                <View style={[styles.heroIconWrap, { backgroundColor: palette.primarySoft }]}>
                                    <Ionicons name="notifications" size={22} color={palette.primary} />
                                </View>
                            </View>
                        </Card>

                        <View style={styles.controlRow}>
                            <View style={styles.segmentRow}>
                                {(["all", "unread"] as const).map((option) => {
                                    const isActive = filter === option;
                                    const label = option === "all" ? "All" : "Unread";
                                    return (
                                        <Pressable
                                            key={option}
                                            onPress={() => setFilter(option)}
                                            style={({ pressed }) => [
                                                styles.segmentChip,
                                                {
                                                    backgroundColor: isActive ? palette.primarySoft : palette.surface,
                                                    borderColor: isActive ? palette.primary : palette.border,
                                                    opacity: pressed ? 0.9 : 1,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.segmentLabel,
                                                    { color: isActive ? palette.primary : palette.textSecondary },
                                                ]}
                                            >
                                                {label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {unreadCount > 0 ? (
                                <Pressable
                                    onPress={() => void markAllRead()}
                                    disabled={actionLoadingId === "all"}
                                    style={({ pressed }) => [
                                        styles.markAllTextBtn,
                                        { opacity: actionLoadingId === "all" ? 0.5 : pressed ? 0.72 : 1 },
                                    ]}
                                >
                                    <Text style={[styles.markAllText, { color: palette.primary }]}>Mark all</Text>
                                </Pressable>
                            ) : null}
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIcon, { backgroundColor: palette.surfaceMuted }]}>
                                <Ionicons name="notifications-outline" size={26} color={palette.textSecondary} />
                            </View>
                            <Text style={[styles.placeholder, { color: palette.textSecondary }]}>Loading notifications...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIcon, { backgroundColor: palette.dangerSoft }]}>
                                <Ionicons name="alert-circle-outline" size={26} color={palette.danger} />
                            </View>
                            <Text style={[styles.placeholder, { color: palette.danger }]}>{error}</Text>
                            <AppButton
                                title="Try again"
                                onPress={() => void reload()}
                                variant="secondary"
                                fullWidth={false}
                            />
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIcon, { backgroundColor: palette.surfaceMuted }]}>
                                <Ionicons name="notifications-off-outline" size={26} color={palette.textSecondary} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>You&apos;re all caught up</Text>
                            <Text style={[styles.placeholder, { color: palette.textSecondary }]}>No new updates right now.</Text>
                            <View style={styles.emptyActions}>
                                <AppButton
                                    title="Go to requests"
                                    onPress={() => router.push(APP_ROUTES.HOME_REQUESTS)}
                                    variant="secondary"
                                    fullWidth={false}
                                />
                                <AppButton
                                    title="Go to messages"
                                    onPress={() => router.push("/messages")}
                                    variant="ghost"
                                    fullWidth={false}
                                />
                            </View>
                        </View>
                    )
                }
                ListFooterComponent={<View style={{ height: theme.spacing.md }} />}
            />
        </TabScreenContainer>
    );
}
