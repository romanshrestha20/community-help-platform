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
        <Card>
          <Stack gap="sm">
            <Row justify="space-between" align="flex-start">
              <View style={styles.flex}>
                <Text style={[styles.name, { color: palette.textPrimary }]}>
                  {bid.helperName}
                </Text>
                <Text style={[styles.amount, { color: palette.primary }]}>
                  {formatBidAmount(bid.amount)}
                </Text>
              </View>

              <BidStatusBadge status={bid.status} />
            </Row>

            {shouldShowProfileAction ? (
              <AppButton
                title="View profile"
                onPress={openProfileModal}
                variant="ghost"
                fullWidth={false}
              />
            ) : null}

            <Text style={[styles.message, { color: palette.textSecondary }]}>
              {bid.message}
            </Text>

            <Text style={[styles.date, { color: palette.textSecondary }]}>
              Submitted {formatBidCreatedAt(bid.createdAt)}
            </Text>

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
  flex: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
  },
  amount: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
  },
});