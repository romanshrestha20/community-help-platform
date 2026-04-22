import React from "react";
import { StyleSheet, View } from "react-native";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { Card, Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  compact?: boolean;
};

export const RequestCardSkeleton = ({ compact = false }: Props) => {
  const { palette } = useThemeContext();

  if (compact) {
    return (
      <Card
        style={[
          styles.compactCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <View
          style={[
            styles.compactAccent,
            { backgroundColor: palette.primarySoft ?? palette.surfaceMuted },
          ]}
        />

        <Row justify="space-between" align="center" style={styles.compactTop}>
          <SkeletonBlock width={92} height={30} radius={15} />
          <SkeletonBlock width={72} height={30} radius={15} />
        </Row>

        <Stack gap="xs">
          <SkeletonBlock width="78%" height={22} radius={8} />
          <SkeletonBlock width="56%" height={22} radius={8} />
        </Stack>

        <Row align="center" gap="sm" style={styles.compactMetaRow}>
          <SkeletonBlock width={86} height={12} radius={6} />
          <SkeletonBlock width={74} height={12} radius={6} />
          <SkeletonBlock width={58} height={14} radius={7} />
        </Row>

        <View style={[styles.compactDivider, { backgroundColor: palette.border }]} />

        <Row justify="space-between" align="center">
          <Row align="center" gap="sm" style={styles.compactOwnerRow}>
            <SkeletonBlock width={36} height={36} radius={18} />
            <SkeletonBlock width={120} height={14} radius={7} />
          </Row>

          <SkeletonBlock width={72} height={28} radius={14} />
        </Row>
      </Card>
    );
  }

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          shadowColor: "#142312",
        },
      ]}
    >
      <Stack gap="sm">
        <Row justify="space-between" align="flex-start" gap="sm">
          <View style={styles.flex}>
            <SkeletonBlock width="72%" height={22} radius={8} />
            <SkeletonBlock width="46%" height={22} radius={8} style={styles.topLineGap} />
          </View>
          <SkeletonBlock width={76} height={28} radius={14} />
        </Row>

        <Row align="center" gap="xs" style={styles.pillRow}>
          <SkeletonBlock width={88} height={24} radius={12} />
          <SkeletonBlock width={68} height={24} radius={12} />
          <SkeletonBlock width={74} height={24} radius={12} />
        </Row>

        <SkeletonBlock width={104} height={26} radius={8} />

        <Stack gap="xs">
          <SkeletonBlock width="100%" height={12} radius={6} />
          <SkeletonBlock width="92%" height={12} radius={6} />
        </Stack>

        <Row gap="xs" style={styles.imageRow}>
          <SkeletonBlock width="48%" height={108} radius={14} style={styles.flex} />
          <SkeletonBlock width="48%" height={108} radius={14} style={styles.flex} />
        </Row>

        <Row align="center" gap="sm">
          <SkeletonBlock width={38} height={38} radius={19} />
          <View style={styles.flex}>
            <SkeletonBlock width="42%" height={13} radius={6} />
            <SkeletonBlock width="28%" height={11} radius={6} style={styles.topLineGap} />
          </View>
        </Row>

        <Stack gap="xs">
          <SkeletonBlock width="74%" height={12} radius={6} />
          <SkeletonBlock width="38%" height={12} radius={6} />
        </Stack>

        <Row justify="flex-end" gap="sm" style={styles.actionRow}>
          <SkeletonBlock width={108} height={34} radius={17} />
          <SkeletonBlock width={104} height={34} radius={17} />
        </Row>
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  topLineGap: {
    marginTop: theme.spacing.xxs,
  },
  card: {
    borderWidth: 0,
    borderRadius: 20,
    padding: 14,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  pillRow: {
    flexWrap: "wrap",
  },
  imageRow: {
    marginVertical: theme.spacing.xxs,
  },
  actionRow: {
    marginTop: theme.spacing.xxs,
  },
  compactCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: theme.spacing.lg,
    overflow: "hidden",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  compactAccent: {
    position: "absolute",
    left: 0,
    top: 18,
    bottom: 18,
    width: 5,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  compactTop: {
    marginBottom: theme.spacing.md,
  },
  compactMetaRow: {
    flexWrap: "wrap",
    marginTop: theme.spacing.sm,
  },
  compactDivider: {
    height: 1,
    marginTop: 16,
    marginBottom: 14,
  },
  compactOwnerRow: {
    flex: 1,
  },
});
