import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { Stack } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { formatBidAmount } from "../utils/bidDisplay";
import { Bid } from "../types/bid.types";

type Props = {
    visible: boolean;
    bid: Bid;
    onClose: () => void;
};

export const BidderProfileModal = ({ visible, bid, onClose }: Props) => {
    const { palette } = useThemeContext();

    const displayGender = useMemo(() => {
        if (!bid.helperGender) return "Not available";

        return bid.helperGender
            .toLowerCase()
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }, [bid.helperGender]);

    return (
        <AppModal
            visible={visible}
            title="Bidder Profile"
            onClose={onClose}
            showCloseButton
            scrollable
            actions={(
                <AppButton
                    title="Done"
                    variant="ghost"
                    fullWidth={false}
                    onPress={onClose}
                />
            )}
        >
            <View style={styles.profileAvatarWrap}>
                <ProfileAvatar
                    uri={bid.helperAvatarUrl}
                    fullName={bid.helperName}
                    size={76}
                />
            </View>

            <Stack gap="xs">
                <View style={styles.profileRow}>
                    <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Name</Text>
                    <Text style={[styles.profileValue, { color: palette.textPrimary }]}>{bid.helperName}</Text>
                </View>

                <View style={styles.profileRow}>
                    <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Gender</Text>
                    <Text style={[styles.profileValue, { color: palette.textPrimary }]}>{displayGender}</Text>
                </View>

                <View style={styles.profileRow}>
                    <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Email</Text>
                    <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
                        {bid.helperEmail || "Not available"}
                    </Text>
                </View>

                <View style={styles.profileRow}>
                    <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Age</Text>
                    <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
                        {typeof bid.helperAge === "number" ? bid.helperAge : "Not available"}
                    </Text>
                </View>

                <View style={styles.profileRow}>
                    <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Location</Text>
                    <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
                        {bid.helperLocation || "Not available"}
                    </Text>
                </View>

                <View style={styles.profileRow}>
                    <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Bid Amount</Text>
                    <Text style={[styles.profileValue, { color: palette.primary }]}>
                        {formatBidAmount(bid.amount)}
                    </Text>
                </View>
            </Stack>

            <View style={[styles.profileMessageBox, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Message</Text>
                <Text style={[styles.profileMessage, { color: palette.textPrimary }]}>{bid.message}</Text>
            </View>
        </AppModal>
    );
};

const styles = StyleSheet.create({
    profileAvatarWrap: {
        alignItems: "center",
        marginBottom: 8,
    },
    profileRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    profileLabel: {
        fontSize: 12,
        fontWeight: "600",
    },
    profileValue: {
        flex: 1,
        textAlign: "right",
        fontSize: 13,
        fontWeight: "600",
    },
    profileMessageBox: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginTop: 6,
        gap: 4,
    },
    profileMessage: {
        fontSize: 13,
        lineHeight: 18,
    },
});
