import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Card, Row, Stack, spacing, typography } from "@/design-system";
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
  onMessage?: () => void;
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
  onMessage,
}: Props) => {
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const { palette } = useThemeContext();

  const helperName = bid.helperName || "Community member";
  const initials = useMemo(() => getInitials(helperName), [helperName]);

  const requesterActions = isRequestOwner || canRespond;
  const helperActions = !requesterActions && canModify;

  const openProfileModal = () => {
    setProfileModalVisible(true);
    onViewProfile?.();
  };

  return (
    <>
      <Pressable onPress={onPress} disabled={!onPress}>
        {({ pressed }) => (
          <Card
            style={[
              styles.card,
              {
                borderColor: palette.border,
                backgroundColor: palette.surface,
                opacity: pressed ? 0.96 : 1,
              },
            ]}
          >
            <Stack gap="md">
              {/* HEADER */}
              <Row justify="space-between" align="flex-start">
                <Row align="center" gap="sm" style={{ flex: 1 }}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: palette.surfaceMuted,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: palette.primary }]}>
                      {initials}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.name, { color: palette.textPrimary }]}
                      numberOfLines={1}
                    >
                      {helperName}
                    </Text>

                    {/* PRICE + TIME */}
                    <Text
                      style={[styles.meta, { color: palette.textSecondary }]}
                    >
                      <Text style={{ color: palette.primary, fontWeight: "700" }}>
                        {formatBidAmount(bid.amount)}
                      </Text>{" "}
                      · {formatBidCreatedAt(bid.createdAt)}
                    </Text>
                  </View>
                </Row>

                <BidStatusBadge status={bid.status} />
              </Row>

              {/* MESSAGE */}
              <Text
                style={[styles.message, { color: palette.textPrimary }]}
                numberOfLines={3}
              >
                {bid.message || "No message provided."}
              </Text>

              {/* ACTIONS */}
              {requesterActions && bid.status === "PENDING" && (
                <Row gap="sm">
                  {onAccept && (
                    <View style={styles.primaryAction}>
                      <AppButton
                        title="Accept"
                        onPress={onAccept}
                        loading={loading}
                        disabled={disableRespondActions || loading}
                      />
                    </View>
                  )}

                  {onReject && (
                    <View style={styles.secondaryAction}>
                      <AppButton
                        title="Reject"
                        onPress={onReject}
                        variant="secondary"
                        loading={loading}
                        disabled={disableRespondActions || loading}
                      />
                    </View>
                  )}
                </Row>
              )}

              {helperActions && bid.status === "PENDING" && (
                <Row gap="sm">
                  {onUpdate && (
                    <View style={styles.secondaryAction}>
                      <AppButton title="Edit" onPress={onUpdate} />
                    </View>
                  )}
                  {onDelete && (
                    <View style={styles.secondaryAction}>
                      <AppButton title="Delete" variant="danger" onPress={onDelete} />
                    </View>
                  )}
                </Row>
              )}

              {bid.status === "ACCEPTED" ? (
                <Stack gap="sm">
                  <Text style={[styles.acceptedLabel, { color: palette.success }]}>
                    You accepted this offer
                  </Text>

                  {onMessage ? (
                    <Row>
                      <View style={styles.primaryAction}>
                        <AppButton
                          title="Message"
                          onPress={onMessage}
                          icon={
                            <Ionicons
                              name="chatbubble-outline"
                              size={16}
                              color={palette.textInverse}
                            />
                          }
                        />
                      </View>
                    </Row>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          </Card>
        )}
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
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: "700",
  },
  meta: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
  },
  message: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  acceptedLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
  },
  primaryAction: {
    flex: 1.2,
  },
  secondaryAction: {
    flex: 1,
  },
});
