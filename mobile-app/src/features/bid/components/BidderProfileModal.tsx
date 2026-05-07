import React, { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { Card, Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { VerificationBadgeList } from "@/features/user/components/VerificationBadgeList";
import { useReviews } from "@/features/reviews/hooks/useReviews";
import { ReviewCard } from "@/features/reviews/components";
import { formatBidAmount } from "../utils/bidDisplay";
import { Bid } from "../types/bid.types";

type Props = {
  visible: boolean;
  bid: Bid;
  onClose: () => void;
  onMessage?: (bid: Bid) => void;
  onAccept?: (bid: Bid) => void;
  accepting?: boolean;
};

const formatEnumLabel = (value?: string | null) => {
  if (!value) return "";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatHelperAge = (age?: number | null) => {
  if (typeof age !== "number" || Number.isNaN(age)) return "";
  return `${age} yrs`;
};

const formatLocationLabel = (value?: string | null) => {
  if (!value) return null;

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
  }

  return value;
};

const SectionHeader = ({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) => {
  const { palette } = useThemeContext();

  return (
    <Row justify="space-between" align="flex-end" gap="md" style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.sectionAction, { color: palette.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Row>
  );
};

const TrustStat = ({
  icon,
  value,
  label,
  tone = "neutral",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tone?: "neutral" | "primary" | "trust";
}) => {
  const { palette } = useThemeContext();
  const color =
    tone === "primary"
      ? palette.primary
      : tone === "trust" && "trust" in palette
        ? palette.trust
        : palette.textSecondary;
  const backgroundColor =
    tone === "primary"
      ? palette.primarySoft
      : tone === "trust" && "trustSoft" in palette
        ? palette.trustSoft
        : palette.surfaceMuted;

  return (
    <View
      style={[
        styles.trustStat,
        {
          backgroundColor,
          borderColor: palette.border,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.trustStatValue, { color: palette.textPrimary }]}>{value}</Text>
      <Text style={[styles.trustStatLabel, { color: palette.textSecondary }]}>{label}</Text>
    </View>
  );
};

const FactPill = ({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.factPill,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <Ionicons name={icon} size={14} color={palette.textSecondary} />
      <Text style={[styles.factPillText, { color: palette.textPrimary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

type QuickFact = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const ExpertiseCard = ({
  title,
  meta,
  primary,
}: {
  title: string;
  meta: string;
  primary?: boolean;
}) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.expertiseCard,
        {
          backgroundColor: primary ? palette.primarySoft : palette.surfaceMuted,
          borderColor: primary ? palette.primary : palette.border,
        },
      ]}
    >
      <Row gap="xs" align="center">
        <Ionicons
          name={primary ? "checkmark-circle" : "checkmark-circle-outline"}
          size={17}
          color={primary ? palette.primary : palette.textSecondary}
        />
        <Text style={[styles.expertiseTitle, { color: palette.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
      </Row>
      <Text style={[styles.expertiseMeta, { color: palette.textSecondary }]}>{meta}</Text>
    </View>
  );
};

const CertificationCard = ({
  name,
  issuer,
  credentialId,
}: {
  name: string;
  issuer: string;
  credentialId?: string | null;
}) => {
  const { palette } = useThemeContext();


  return (
    <View
      style={[
        styles.certificationCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={[styles.certIcon, { backgroundColor: palette.primarySoft }]}>
        <Ionicons name="ribbon-outline" size={18} color={palette.primary} />
      </View>
      <View style={styles.certCopy}>
        <Text style={[styles.certTitle, { color: palette.textPrimary }]}>{name}</Text>
        <Text style={[styles.certIssuer, { color: palette.textSecondary }]}>{issuer}</Text>
        {credentialId ? (
          <Text style={[styles.certIssuer, { color: palette.textSecondary }]}>
            Credential ID: {credentialId}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export const BidderProfileModal = ({
  visible,
  bid,
  onClose,
  onMessage,
  onAccept,
  accepting = false,
}: Props) => {
  const { palette } = useThemeContext();
  const { getCachedReviews, getCachedSummary, getUserReviews, loadingByUserId } = useReviews();
  const helperId = bid.helperId?.trim() ?? "";

  useEffect(() => {
    if (!visible || !helperId) return;

    void getUserReviews(helperId, {
      limit: 3,
      forceRefresh: true,
    });
  }, [getUserReviews, helperId, visible]);

  const summary = helperId
    ? getCachedSummary(helperId)
    : { rating: 0, totalReviews: 0, completedHelps: 0 };
  const reviews = helperId ? getCachedReviews(helperId) : [];
  const reviewsLoading = helperId ? Boolean(loadingByUserId[helperId]) : false;

  const helperSkills = bid.helperSkills ?? [];
  const approvedCertifications = bid.helperApprovedCertifications ?? [];
  const helperVerificationBadges = bid.helperVerificationBadges ?? [];

  const displayGender = useMemo(() => formatEnumLabel(bid.helperGender), [bid.helperGender]);

  const quickFacts: QuickFact[] = [];
  const locationLabel = formatLocationLabel(bid.helperLocation);
  if (locationLabel) {
    quickFacts.push({ icon: "location-outline", label: locationLabel });
  }
  if (bid.helperGender) {
    quickFacts.push({ icon: "person-outline", label: displayGender });
  }
  if (typeof bid.helperAge === "number") {
    quickFacts.push({ icon: "calendar-outline", label: formatHelperAge(bid.helperAge) });
  }

  const hasTrustBadges = helperVerificationBadges.length > 0;
  const completedHelps = summary.completedHelps ?? 0;
  const ratingLabel = summary.totalReviews > 0 ? summary.rating.toFixed(1) : "New";
  const reviewsLabel = `${summary.totalReviews} review${summary.totalReviews === 1 ? "" : "s"}`;
  const trustSubtitle =
    summary.totalReviews > 0
      ? `${summary.rating.toFixed(1)} average from ${reviewsLabel}`
      : "New helper · building profile";
  const heroTextColor = palette.textInverse;
  const heroMutedTextColor = `${palette.textInverse}CC`;
  const heroBorderColor = `${palette.textInverse}2A`;
  const heroSoftBg = `${palette.textInverse}14`;

  return (
    <AppModal
      visible={visible}
      title="Helper Profile"
      onClose={onClose}
      scrollable
      size="lg"
      actions={
        <View style={styles.footerActions}>
          {onMessage ? (
            <View style={styles.footerActionCell}>
              <AppButton
                title="Message"
                variant="secondary"
                onPress={() => onMessage(bid)}
              />
            </View>
          ) : null}
          {onAccept ? (
            <View style={styles.footerActionCell}>
              <AppButton
                title={`Accept ${formatBidAmount(bid.amount)}`}
                loading={accepting}
                disabled={accepting}
                onPress={() => onAccept(bid)}
              />
            </View>
          ) : (
            <AppButton title="Done" variant="ghost" fullWidth={false} onPress={onClose} />
          )}
        </View>
      }
    >
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: palette.primaryDark,
          },
        ]}
      >
        <View style={styles.heroGlow} />
        <ProfileAvatar uri={bid.helperAvatarUrl} fullName={bid.helperName} size={72} />

        <View style={styles.heroCopy}>
          <Text style={[styles.heroEyebrow, { color: heroMutedTextColor }]}>Helper proposal</Text>
          <Text style={[styles.heroName, { color: heroTextColor }]}>{bid.helperName || "Community helper"}</Text>
          <Row gap="xs" align="center" justify="center">
            <Ionicons name="star" size={15} color={palette.warning} />
            <Text style={[styles.heroRating, { color: heroTextColor }]}>{ratingLabel}</Text>
            <Text style={[styles.heroMeta, { color: heroMutedTextColor }]}>· {reviewsLabel}</Text>
          </Row>
        </View>

        {hasTrustBadges ? (
          <VerificationBadgeList badges={helperVerificationBadges} compact />
        ) : (
          <View
            style={[
              styles.unverifiedPill,
              {
                borderColor: heroBorderColor,
                backgroundColor: heroSoftBg,
              },
            ]}
            >
              <Ionicons name="alert-circle-outline" size={14} color={heroMutedTextColor} />
            <Text style={[styles.unverifiedText, { color: heroMutedTextColor }]}>Building profile</Text>
          </View>
        )}

        <View style={styles.heroStatsGrid}>
          <TrustStat icon="star" value={ratingLabel} label="Rating" tone="trust" />
          <TrustStat icon="checkmark-done-outline" value={`${completedHelps}`} label="Completed" tone="primary" />
          <TrustStat icon="shield-checkmark-outline" value={hasTrustBadges ? "Yes" : "New"} label="Verified" />
        </View>
      </View>

      <View
        style={[
          styles.offerCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      >
        <Row justify="space-between" align="flex-start" gap="md">
          <View style={styles.offerCopy}>
            <Text style={[styles.offerLabel, { color: palette.textSecondary }]}>Submitted offer</Text>
            <Text style={[styles.offerAmount, { color: palette.primary }]}>
              {formatBidAmount(bid.amount)}
            </Text>
          </View>
          <View style={[styles.offerIcon, { backgroundColor: palette.primarySoft }]}>
            <Ionicons name="cash-outline" size={20} color={palette.primary} />
          </View>
        </Row>
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: palette.surfaceMuted,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.messageEyebrow, { color: palette.textSecondary }]}>Message</Text>
          <Text style={[styles.offerMessage, { color: palette.textPrimary }]}>
            “{bid.message || "No message provided."}”
          </Text>
        </View>
      </View>

      {quickFacts.length > 0 ? (
        <View style={styles.factWrap}>
          {quickFacts.map((fact) => (
            <FactPill key={`${fact.icon}-${fact.label}`} icon={fact.icon} label={fact.label} />
          ))}
        </View>
      ) : null}

      <SectionHeader title="Trust overview" subtitle={trustSubtitle} />

      {helperSkills.length > 0 ? (
        <>
          <SectionHeader
            title="Skills"
            subtitle="Relevant expertise this helper added to their profile."
          />
          <View style={styles.expertiseGrid}>
            {helperSkills.map((entry) => {
              const years =
                typeof entry.yearsExperience === "number"
                  ? ` · ${entry.yearsExperience} yr${entry.yearsExperience === 1 ? "" : "s"}`
                  : "";
              const meta = entry.isPrimary
                ? `Primary skill${years}`
                : `${formatEnumLabel(entry.experienceLevel)}${years}`;

              return (
                <ExpertiseCard
                  key={entry.id}
                  title={entry.skill?.name || "Skill"}
                  meta={meta}
                  primary={entry.isPrimary}
                />
              );
            })}
          </View>
        </>
      ) : null}

      {approvedCertifications.length > 0 ? (
        <>
          <SectionHeader
            title="Trust overview"
            subtitle="Verified certifications."
          />
          <Stack gap="sm">
            {approvedCertifications.map((certification) => (
              <CertificationCard
                key={certification.id}
                name={certification.name}
                issuer={certification.issuer}
                credentialId={certification.credentialId}
              />
            ))}
          </Stack>
        </>
      ) : null}

      <SectionHeader
        title="Reviews"
        subtitle="Recent feedback from completed requests."
      />

      {reviews.length > 0 ? (
        <Stack gap="sm">
          {reviews.slice(0, 3).map((review) => (
            <ReviewCard key={review.id} review={review} showRequestContext />
          ))}
        </Stack>
      ) : (
        <Card style={styles.emptyReviewCard}>
          <Ionicons name="chatbox-outline" size={22} color={palette.textSecondary} />
          <Text style={[styles.emptyReviewTitle, { color: palette.textPrimary }]}>No reviews yet</Text>
          <Text style={[styles.emptyReviewText, { color: palette.textSecondary }]}>
            New helper with no public reviews yet.
          </Text>
        </Card>
      )}

      {reviewsLoading ? (
        <Row gap="xs" align="center" justify="center" style={styles.loadingRow}>
          <Ionicons name="refresh-outline" size={14} color={palette.textSecondary} />
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>Loading reviews...</Text>
        </Row>
      ) : null}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  heroGlow: {
    position: "absolute",
    top: -64,
    right: -52,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  heroCopy: {
    alignItems: "center",
    gap: 4,
  },
  heroEyebrow: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroName: {
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "800",
    textAlign: "center",
  },
  heroRating: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  heroMeta: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  unverifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
    backgroundColor: "transparent",
  },
  unverifiedText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  heroStatsGrid: {
    width: "100%",
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  trustGrid: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  trustStat: {
    flex: 1,
    minHeight: 82,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    justifyContent: "center",
    gap: 3,
  },
  trustStatValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: "800",
  },
  trustStatLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  offerCard: {
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  offerCopy: {
    flex: 1,
  },
  offerLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  offerAmount: {
    marginTop: 2,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  offerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  messageBubble: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  messageEyebrow: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  offerMessage: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
  },
  factWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  factPill: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: theme.radius.fill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
  },
  factPillText: {
    maxWidth: 230,
    fontSize: theme.typography.fontSize.xs + 1,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sectionHeader: {
    marginTop: theme.spacing.sm,
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sectionAction: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  expertiseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  expertiseCard: {
    width: "48%",
    minWidth: 145,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  expertiseTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "800",
  },
  expertiseMeta: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
    fontWeight: theme.typography.fontWeight.medium,
  },
  certificationCard: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  certIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  certCopy: {
    flex: 1,
    gap: 2,
  },
  certTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "800",
  },
  certIssuer: {
    fontSize: theme.typography.fontSize.xs + 1,
    lineHeight: theme.typography.lineHeight.xs + 3,
  },
  emptyReviewCard: {
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.lg,
  },
  emptyReviewTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyReviewText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    textAlign: "center",
  },
  loadingRow: {
    paddingVertical: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  footerActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  footerActionCell: {
    flex: 1,
  },
});
