import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, Row, Stack } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { Bid } from "../types/bid.types";
import { BidStatusBadge } from "./BidStatusBadge";
import { BidderProfileModal } from "./BidderProfileModal";
import { formatBidAmount, formatBidCreatedAt } from "../utils/bidDisplay";

type Props = {
  bid: Bid;
  onPress?: () => void;
  onViewProfile?: () => void;
  isRequestOwner?: boolean;
  canRespond?: boolean;
  canModify?: boolean;
  disableRespondActions?: boolean;
  loading?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
};

export const BidCard = ({
  bid,
  onPress,
  onViewProfile,
  isRequestOwner = false,
  canRespond = false,
  canModify = false,
  disableRespondActions = false,
  loading = false,
  onAccept,
  onReject,
  onUpdate,
  onDelete,
}: Props) => {
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const { palette } = useThemeContext();
  const requesterActions = isRequestOwner || canRespond;
  const helperActions = !requesterActions && canModify;
  const shouldShowProfileAction = requesterActions || Boolean(onViewProfile);

  const openProfileModal = () => {
    setProfileModalVisible(true);
    onViewProfile?.();
  };

  return (
    <>
      <Pressable onPress={onPress}>
        <Card style={styles.card}>
          <Stack gap="sm">
            <Row justify="space-between" align="flex-start">
              <View style={styles.flex}>
                <Text style={[styles.name, { color: palette.textPrimary }]}>
                  {bid.helperName}
                </Text>
              </View>

              <BidStatusBadge status={bid.status} />
            </Row>

            <View style={[styles.amountPanel, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
              <Text style={[styles.amountLabel, { color: palette.textSecondary }]}>Bid amount</Text>
              <Text style={[styles.amount, { color: palette.primary }]}>{formatBidAmount(bid.amount)}</Text>
            </View>

            {shouldShowProfileAction ? (
              <AppButton
                title="View profile"
                onPress={openProfileModal}
                variant="ghost"
                fullWidth={false}
              />
            ) : null}

            <View style={[styles.messagePanel, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
              <Text style={[styles.messageLabel, { color: palette.textSecondary }]}>Message</Text>
              <Text style={[styles.message, { color: palette.textSecondary }]}>{bid.message}</Text>
            </View>

            <View style={[styles.metaChip, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
              <Text style={[styles.date, { color: palette.textSecondary }]}>Submitted {formatBidCreatedAt(bid.createdAt)}</Text>
            </View>

            {requesterActions && bid.status === "PENDING" && (onAccept || onReject) ? (
              <Row gap="sm">
                {onAccept ? (
                  <AppButton
                    title="Accept"
                    onPress={onAccept}
                    loading={loading}
                    disabled={disableRespondActions}
                  />
                ) : null}
                {onReject ? (
                  <AppButton
                    title="Reject"
                    onPress={onReject}
                    loading={loading}
                    variant="secondary"
                    disabled={disableRespondActions}
                  />
                ) : null}
              </Row>
            ) : null}

            {helperActions && bid.status === "PENDING" && (onUpdate || onDelete) ? (
              <Row gap="sm">
                {onUpdate ? <AppButton title="Edit" onPress={onUpdate} /> : null}
                {onDelete ? (
                  <AppButton
                    title="Delete"
                    onPress={onDelete}
                    variant="secondary"
                  />
                ) : null}
              </Row>
            ) : null}
          </Stack>
        </Card>
      </Pressable>

      <BidderProfileModal
        visible={profileModalVisible}
        bid={bid}
        onClose={() => setProfileModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
  },
  flex: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
  },
  amountPanel: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  amount: {
    marginTop: 3,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
  },
  messagePanel: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  date: {
    fontSize: 12,
    fontWeight: "500",
  },
});