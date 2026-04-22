import React from "react";
import { StyleSheet, View } from "react-native";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { Card, Row, Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export const RequestDetailsSkeleton = () => {
  const { palette } = useThemeContext();

  return (
    <Stack gap="md">
      <Card style={[styles.headerCard, { backgroundColor: palette.surface }]}>
        <Stack gap="md">
          <Row justify="space-between" align="center">
            <SkeletonBlock width={96} height={28} radius={14} />
            <SkeletonBlock width={82} height={28} radius={14} />
          </Row>

          <Stack gap="xs">
            <SkeletonBlock width="74%" height={28} radius={10} />
            <SkeletonBlock width="58%" height={28} radius={10} />
          </Stack>

          <View
            style={[
              styles.panel,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            <Stack gap="xs">
              <SkeletonBlock width={110} height={12} radius={6} />
              <SkeletonBlock width={124} height={34} radius={10} />
              <Row justify="space-between" align="center">
                <SkeletonBlock width={88} height={12} radius={6} />
                <SkeletonBlock width={96} height={12} radius={6} />
              </Row>
            </Stack>
          </View>

          <Row align="center" gap="sm">
            <SkeletonBlock width={46} height={46} radius={23} />
            <View style={styles.flex}>
              <SkeletonBlock width="42%" height={14} radius={7} />
              <SkeletonBlock width="28%" height={12} radius={6} style={styles.inlineGap} />
            </View>
          </Row>

          <Stack gap="xs">
            <SkeletonBlock width="54%" height={12} radius={6} />
            <SkeletonBlock width="38%" height={12} radius={6} />
          </Stack>

          <View
            style={[
              styles.panel,
              {
                backgroundColor: palette.surfaceMuted,
                borderColor: palette.border,
              },
            ]}
          >
            <Stack gap="xs">
              <SkeletonBlock width={148} height={14} radius={7} />
              <SkeletonBlock width="100%" height={12} radius={6} />
              <SkeletonBlock width="92%" height={12} radius={6} />
              <SkeletonBlock width="76%" height={12} radius={6} />
            </Stack>
          </View>
        </Stack>
      </Card>

      <Card style={[styles.bodyCard, { backgroundColor: palette.surface }]}>
        <Stack gap="sm">
          <SkeletonBlock width={104} height={24} radius={12} />
          <SkeletonBlock width="44%" height={20} radius={8} />
          <SkeletonBlock width="86%" height={12} radius={6} />

          <Stack gap="sm" style={styles.bodyList}>
            {Array.from({ length: 2 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.bidPlaceholder,
                  {
                    backgroundColor: palette.surfaceMuted,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Stack gap="sm">
                  <Row justify="space-between" align="center">
                    <Row align="center" gap="sm" style={styles.flex}>
                      <SkeletonBlock width={42} height={42} radius={21} />
                      <View style={styles.flex}>
                        <SkeletonBlock width="46%" height={13} radius={6} />
                        <SkeletonBlock width="34%" height={11} radius={6} style={styles.inlineGap} />
                      </View>
                    </Row>
                    <SkeletonBlock width={70} height={24} radius={12} />
                  </Row>

                  <SkeletonBlock width="100%" height={12} radius={6} />
                  <SkeletonBlock width="88%" height={12} radius={6} />

                  <Row justify="flex-end" gap="sm">
                    <SkeletonBlock width={88} height={32} radius={16} />
                    <SkeletonBlock width={92} height={32} radius={16} />
                  </Row>
                </Stack>
              </View>
            ))}
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inlineGap: {
    marginTop: theme.spacing.xxs,
  },
  headerCard: {
    borderRadius: theme.radius.xl,
  },
  bodyCard: {
    borderRadius: theme.radius.xl,
  },
  panel: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  bodyList: {
    marginTop: theme.spacing.xs,
  },
  bidPlaceholder: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
});
