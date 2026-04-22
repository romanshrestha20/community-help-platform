import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { Card, Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import type { HelpRequest } from "../types/helpRequest.types";
import { getRequestCategoryLabel } from "../utils/requestDisplay";

type HeaderChip = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  emphasis?: "accent" | "warning";
};

type HeaderFooter = {
  fullName: string;
  avatarUrl?: string | null;
  meta: string;
  label?: string;
};

type HeaderTone = "open" | "assigned" | "completed" | "cancelled" | "dimmed";

type Props = {
  request: HelpRequest;
  tone?: HeaderTone;
  statusLabel: string;
  headerBadgeLabel?: string;
  titleMuted?: boolean;
  chips?: HeaderChip[];
  footer?: HeaderFooter;
};

const getDescriptionBullets = (description: string): string[] => {
  const cleaned = description
    .replace(/^need\s+help\s+with[:\s-]*/i, "")
    .replace(/^looking\s+for\s+/i, "")
    .trim();

  const parts = cleaned
    .split(/[\n.;]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return [cleaned || description.trim()].filter(Boolean);
  }

  return parts;
};

export const RequestDetailsHeader = ({
  request,
  tone = "open",
  statusLabel,
  headerBadgeLabel,
  titleMuted = false,
  chips = [],
  footer,
}: Props) => {
  const { palette } = useThemeContext();
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const descriptionBullets = useMemo(
    () => getDescriptionBullets(request.description),
    [request.description]
  );

  const categoryLabel = getRequestCategoryLabel(request);

  const toneStyles = {
    open: {
      backgroundColor: "#163A2E",
      surfaceColor: "rgba(255,255,255,0.08)",
      surfaceBorder: "rgba(255,255,255,0.14)",
      titleColor: "#F6FAF7",
      bodyColor: "rgba(246,250,247,0.82)",
      pillBackground: "#D9F2E2",
      pillText: "#1A6B43",
      categoryBackground: "rgba(255,255,255,0.10)",
      categoryText: "#EAF5EE",
      badgeBackground: "#D7B461",
      badgeText: "#2B2110",
      footerLabel: "#B9D4C3",
    },
    assigned: {
      backgroundColor: "#1C2F4B",
      surfaceColor: "rgba(255,255,255,0.08)",
      surfaceBorder: "rgba(255,255,255,0.14)",
      titleColor: "#F5F8FC",
      bodyColor: "rgba(245,248,252,0.82)",
      pillBackground: "#F4D88B",
      pillText: "#6A4D06",
      categoryBackground: "rgba(255,255,255,0.10)",
      categoryText: "#E8EEF6",
      badgeBackground: "#F4D88B",
      badgeText: "#5C4510",
      footerLabel: "#C3D0E4",
    },
    completed: {
      backgroundColor: "#32264F",
      surfaceColor: "rgba(255,255,255,0.08)",
      surfaceBorder: "rgba(255,255,255,0.14)",
      titleColor: "#F7F5FC",
      bodyColor: "rgba(247,245,252,0.82)",
      pillBackground: "#DBD1FF",
      pillText: "#5A3FB2",
      categoryBackground: "rgba(255,255,255,0.10)",
      categoryText: "#ECE7FA",
      badgeBackground: "#DBD1FF",
      badgeText: "#4E3A8A",
      footerLabel: "#CFC6E9",
    },
    cancelled: {
      backgroundColor: "#4A2B24",
      surfaceColor: "rgba(255,255,255,0.06)",
      surfaceBorder: "rgba(255,255,255,0.12)",
      titleColor: "rgba(255,244,241,0.68)",
      bodyColor: "rgba(255,244,241,0.76)",
      pillBackground: "#F3C1B6",
      pillText: "#8D4435",
      categoryBackground: "rgba(255,255,255,0.10)",
      categoryText: "#F4DFD9",
      badgeBackground: "#F3C1B6",
      badgeText: "#72372C",
      footerLabel: "#DDB8AE",
    },
    dimmed: {
      backgroundColor: "#3B4146",
      surfaceColor: "rgba(255,255,255,0.06)",
      surfaceBorder: "rgba(255,255,255,0.10)",
      titleColor: "rgba(244,246,248,0.74)",
      bodyColor: "rgba(244,246,248,0.76)",
      pillBackground: "#F1C5BE",
      pillText: "#8D4940",
      categoryBackground: "rgba(255,255,255,0.10)",
      categoryText: "#DCE2E7",
      badgeBackground: "#F1C5BE",
      badgeText: "#6F3832",
      footerLabel: "#BFC8D0",
    },
  }[tone];

  return (
    <Card style={[styles.card, { backgroundColor: toneStyles.backgroundColor }]}>
      <Stack gap="md">
        <Row justify="space-between" align="center" style={styles.topRow}>
          <View
            style={[
              styles.categoryPill,
              {
                backgroundColor: toneStyles.categoryBackground,
                borderColor: toneStyles.surfaceBorder,
              },
            ]}
          >
            <Text style={[styles.categoryPillLabel, { color: toneStyles.categoryText }]}>
              {categoryLabel}
            </Text>
          </View>

          <Row gap="xs" align="center">
            {headerBadgeLabel ? (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: toneStyles.badgeBackground,
                  },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: toneStyles.badgeText }]}>
                  {headerBadgeLabel}
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: toneStyles.pillBackground,
                },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: toneStyles.pillText }]}>
                {statusLabel}
              </Text>
            </View>
          </Row>
        </Row>

        <Text
          style={[
            styles.title,
            {
              color: toneStyles.titleColor,
              textDecorationLine: titleMuted ? "line-through" : "none",
            },
          ]}
        >
          {request.title}
        </Text>

        {chips.length > 0 ? (
          <View style={styles.chipWrap}>
            {chips.map((chip) => {
              const color =
                chip.emphasis === "accent"
                  ? palette.primary
                  : chip.emphasis === "warning"
                    ? palette.warning
                    : toneStyles.bodyColor;

              return (
                <View
                  key={`${chip.icon}-${chip.label}`}
                  style={[
                    styles.infoChip,
                    {
                      backgroundColor: toneStyles.surfaceColor,
                      borderColor: toneStyles.surfaceBorder,
                    },
                  ]}
                >
                  <Ionicons name={chip.icon} size={14} color={color} />
                  <Text style={[styles.infoChipText, { color }]}>{chip.label}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {footer ? (
          <Pressable
            onPress={() => setProfileModalVisible(true)}
            style={({ pressed }) => [
              styles.footerRow,
              {
                backgroundColor: toneStyles.surfaceColor,
                borderColor: toneStyles.surfaceBorder,
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <ProfileAvatar
              uri={footer.avatarUrl}
              fullName={footer.fullName}
              size={44}
            />

            <View style={styles.footerCopy}>
              <Text style={[styles.footerName, { color: toneStyles.titleColor }]}>
                {footer.fullName}
              </Text>
              <Text style={[styles.footerMeta, { color: toneStyles.footerLabel }]}>
                {footer.meta}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={toneStyles.footerLabel}
            />
          </Pressable>
        ) : null}

        <View
          style={[
            styles.descriptionPanel,
            {
              backgroundColor: toneStyles.surfaceColor,
              borderColor: toneStyles.surfaceBorder,
            },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: toneStyles.titleColor }]}>
            What needs to be done
          </Text>

          <Stack gap="xs" style={styles.descriptionList}>
            {descriptionBullets.map((line, index) => (
              <Row key={`${line}-${index}`} gap="xs" align="flex-start" style={styles.descriptionRow}>
                <View
                  style={[
                    styles.bulletDot,
                    { backgroundColor: palette.primarySoft ?? "#B7E0C7" },
                  ]}
                />
                <Text style={[styles.descriptionItem, { color: toneStyles.bodyColor }]}>
                  {line}
                </Text>
              </Row>
            ))}
          </Stack>
        </View>
      </Stack>

      <AppModal
        visible={profileModalVisible}
        title="Requester Profile"
        onClose={() => setProfileModalVisible(false)}
        showCloseButton
        scrollable
        actions={
          <AppButton
            title="Done"
            variant="ghost"
            fullWidth={false}
            onPress={() => setProfileModalVisible(false)}
          />
        }
      >
        <View style={styles.profileAvatarWrap}>
          <ProfileAvatar
            uri={request.requesterAvatarUrl}
            fullName={request.requesterName}
            size={76}
          />
        </View>

        <Stack gap="xs">
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Name</Text>
            <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
              {request.requesterName}
            </Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Role</Text>
            <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
              Community member
            </Text>
          </View>

          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: palette.textSecondary }]}>Location</Text>
            <Text style={[styles.profileValue, { color: palette.textPrimary }]}>
              {request.requesterLocation || "Location not provided"}
            </Text>
          </View>
        </Stack>
      </AppModal>
    </Card>
  );
};

const HALF_XXS = theme.spacing.xxs / 2;
const PANEL_RADIUS = theme.radius.lg + HALF_XXS;
const BULLET_SIZE = theme.spacing.xs - 1;
const BULLET_OFFSET_TOP = theme.spacing.xs - 1;

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    overflow: "hidden",
  },
  topRow: {
    alignItems: "flex-start",
  },
  categoryPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs + 4,
    borderRadius: theme.radius.fill,
    borderWidth: 1,
  },
  categoryPillLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadge: {
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs + 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
    gap: theme.spacing.xxs,
  },
  infoChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderRadius: PANEL_RADIUS,
    padding: theme.spacing.sm,
  },
  footerCopy: {
    flex: 1,
  },
  footerName: {
    fontSize: 15,
    fontWeight: "700",
  },
  footerMeta: {
    marginTop: HALF_XXS,
    fontSize: 13,
  },
  descriptionPanel: {
    borderWidth: 1,
    borderRadius: PANEL_RADIUS,
    padding: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  descriptionList: {
    marginTop: theme.spacing.xs,
  },
  descriptionRow: {
    paddingRight: theme.spacing.xs,
  },
  bulletDot: {
    width: BULLET_SIZE,
    height: BULLET_SIZE,
    borderRadius: theme.radius.fill,
    marginTop: BULLET_OFFSET_TOP,
  },
  descriptionItem: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  profileAvatarWrap: {
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
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
});
