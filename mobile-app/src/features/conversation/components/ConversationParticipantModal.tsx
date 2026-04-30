import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { getUserReviews } from "@/features/reviews/services/review.service";
import type { ReviewSummary } from "@/features/reviews/types/review.types";

import { ConversationMember } from "../types/conversation.type";

type Props = {
    visible: boolean;
    participant: ConversationMember | null;
    roleLabel?: string;
    requestTitle?: string;
    onViewRequest?: () => void;
    onViewProfile?: () => void;
    onClose: () => void;
};

const ConversationParticipantModal = ({
    visible,
    participant,
    roleLabel,
    requestTitle,
    onViewRequest,
    onViewProfile,
    onClose,
}: Props) => {
    const { palette } = useThemeContext();
    const insets = useSafeAreaInsets();
    const [summary, setSummary] = useState<ReviewSummary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const displayName = participant?.fullName || participant?.email || "Community member";
    const subtitle = "Community member";

    useEffect(() => {
        let active = true;

        const loadSummary = async () => {
            if (!visible || !participant?.id) {
                setSummary(null);
                setSummaryError(null);
                setLoadingSummary(false);
                return;
            }

            setLoadingSummary(true);
            setSummaryError(null);

            try {
                const result = await getUserReviews(participant.id, { page: 1, limit: 1 });
                if (!active) return;
                setSummary(result.summary);
            } catch {
                if (!active) return;
                setSummary(null);
                setSummaryError("Profile data unavailable right now");
            } finally {
                if (active) {
                    setLoadingSummary(false);
                }
            }
        };

        void loadSummary();

        return () => {
            active = false;
        };
    }, [participant?.id, visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.backdropWrap}>
                <Pressable
                    style={[styles.backdrop, { backgroundColor: palette.overlay }]}
                    onPress={onClose}
                />

                <View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: palette.surface,
                            borderTopColor: palette.border,
                            paddingBottom: Math.max(insets.bottom, theme.spacing.md),
                        },
                    ]}
                >
                    <View style={[styles.handle, { backgroundColor: palette.border }]} />

                    <View style={styles.avatarWrap}>
                        <View
                            style={[
                                styles.avatarRing,
                                { borderColor: palette.primarySoft, backgroundColor: palette.surfaceMuted },
                            ]}
                        >
                            <ProfileAvatar uri={participant?.avatarUrl} fullName={displayName} size={76} />
                        </View>
                        <View style={[styles.statusDot, { backgroundColor: palette.primary }]} />
                    </View>

                    <Text style={[styles.name, { color: palette.textPrimary }]} numberOfLines={1}>
                        {displayName}
                    </Text>
                    <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>

                    <View style={[styles.rolePill, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}> 
                        <Text style={[styles.rolePillText, { color: palette.textPrimary }]}>
                            {roleLabel || "Conversation participant"}
                        </Text>
                    </View>

                    <View style={styles.trustList}>
                        {loadingSummary ? (
                            <Text style={[styles.trustText, { color: palette.textSecondary }]}>Loading profile trust signals...</Text>
                        ) : summary && summary.totalReviews > 0 ? (
                            <View style={styles.trustItem}>
                                <Ionicons name="star" size={16} color={palette.primary} />
                                <Text style={[styles.trustText, { color: palette.textPrimary }]}>
                                    {summary.rating.toFixed(1)} rating · {summary.totalReviews} review{summary.totalReviews === 1 ? "" : "s"}
                                </Text>
                            </View>
                        ) : null}
                        <View style={styles.trustItem}>
                            <Ionicons name="checkmark-circle" size={16} color={palette.primary} />
                            <Text style={[styles.trustText, { color: palette.textPrimary }]}>Identity confirmed in chat</Text>
                        </View>
                        <View style={styles.trustItem}>
                            <Ionicons name="shield-checkmark" size={16} color={palette.primary} />
                            <Text style={[styles.trustText, { color: palette.textPrimary }]}>Role verified for this request</Text>
                        </View>
                        {summaryError ? (
                            <Text style={[styles.trustText, { color: palette.textSecondary }]}>{summaryError}</Text>
                        ) : null}
                    </View>

                    {onViewProfile || onViewRequest ? (
                        <View style={[styles.actionsBox, { borderTopColor: palette.border }]}> 
                            {onViewProfile ? (
                                <Pressable onPress={onViewProfile} style={styles.linkRow}>
                                    <Text style={[styles.linkText, { color: palette.primary }]}>View full profile</Text>
                                    <Ionicons name="chevron-forward" size={16} color={palette.primary} />
                                </Pressable>
                            ) : null}
                            {onViewRequest ? (
                                <Pressable onPress={onViewRequest} style={styles.linkRow}>
                                    <Text style={[styles.linkText, { color: palette.primary }]} numberOfLines={1}>
                                        {requestTitle ? `View request: ${requestTitle}` : "View request"}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color={palette.primary} />
                                </Pressable>
                            ) : null}
                        </View>
                    ) : null}

                    <AppButton title="Close" variant="secondary" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdropWrap: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        borderTopWidth: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    handle: {
        alignSelf: "center",
        width: 44,
        height: 5,
        borderRadius: 3,
        marginBottom: theme.spacing.xs,
    },
    avatarWrap: {
        alignSelf: "center",
    },
    avatarRing: {
        borderWidth: 2,
        borderRadius: 48,
        padding: 4,
    },
    statusDot: {
        position: "absolute",
        right: 4,
        bottom: 6,
        width: 13,
        height: 13,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    name: {
        ...theme.typography.textStyle.bodyMedium,
        fontWeight: "800",
        textAlign: "center",
    },
    subtitle: {
        ...theme.typography.textStyle.caption,
        textAlign: "center",
        marginTop: -4,
    },
    rolePill: {
        alignSelf: "center",
        borderWidth: 1,
        borderRadius: theme.radius.fill,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    rolePillText: {
        ...theme.typography.textStyle.captionMedium,
    },
    trustList: {
        gap: theme.spacing.xs,
        paddingTop: theme.spacing.xs,
    },
    trustItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    trustText: {
        ...theme.typography.textStyle.bodySmall,
    },
    actionsBox: {
        borderTopWidth: 1,
        marginTop: theme.spacing.xs,
        paddingTop: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    linkRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
    },
    linkText: {
        ...theme.typography.textStyle.bodySmallMedium,
        flex: 1,
    },
});

export default ConversationParticipantModal;
