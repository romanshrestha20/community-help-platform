import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Card, Stack, theme } from "@/design-system";
import { FormContainer } from "@/components/ui/FormContainer";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type AuthScreenProps = {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

type AuthHeroProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow?: string;
  progressLabel?: string;
  progressValue?: number;
};

type AuthCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

type AuthBannerProps = {
  tone?: "error" | "success" | "info";
  children: React.ReactNode;
};

type AuthActionsProps = {
  children: React.ReactNode;
};

type AuthFooterLinkProps = {
  prefix?: string;
  actionLabel: string;
  onPress: () => void;
};

type AuthDividerProps = {
  label?: string;
};

export const AuthScreen = ({
  children,
  contentContainerStyle,
}: AuthScreenProps) => {
  const { palette } = useThemeContext();

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: palette.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        pointerEvents="none"
        style={[
          styles.backgroundOrbTop,
          { backgroundColor: palette.primarySoft ?? palette.surfaceMuted },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.backgroundOrbBottom,
          { backgroundColor: palette.secondarySoft ?? palette.surfaceMuted },
        ]}
      />

      <FormContainer
        withTabBarSpacing={false}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      >
        {children}
      </FormContainer>
    </KeyboardAvoidingView>
  );
};

export const AuthHero = ({
  title,
  subtitle,
  icon,
  eyebrow,
  progressLabel,
  progressValue,
}: AuthHeroProps) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.hero}>
      <View style={styles.heroTopRow}>
        <View
          style={[
            styles.heroIconBadge,
            { backgroundColor: palette.primarySoft ?? palette.surfaceMuted },
          ]}
        >
          <Ionicons name={icon} size={20} color={palette.primary} />
        </View>

        {progressLabel || typeof progressValue === "number" ? (
          <View style={styles.progressWrap}>
            {progressLabel ? (
              <Text
                style={[styles.progressLabel, { color: palette.textSecondary }]}
              >
                {progressLabel}
              </Text>
            ) : null}

            {typeof progressValue === "number" ? (
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: palette.surfaceMuted },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(0, Math.min(100, progressValue))}%`,
                      backgroundColor: palette.primary,
                    },
                  ]}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <Stack gap="xs">
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: palette.textSecondary }]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          {subtitle}
        </Text>
      </Stack>
    </View>
  );
};

export const AuthCard = ({ children, style }: AuthCardProps) => {
  const { palette } = useThemeContext();

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      {children}
    </Card>
  );
};

export const AuthBanner = ({
  tone = "info",
  children,
}: AuthBannerProps) => {
  const { palette } = useThemeContext();
  const toneMap = {
    error: {
      icon: "alert-circle-outline" as const,
      backgroundColor: palette.dangerSoft ?? palette.surfaceMuted,
      borderColor: palette.danger,
      color: palette.danger,
    },
    success: {
      icon: "checkmark-circle-outline" as const,
      backgroundColor: palette.successSoft ?? palette.surfaceMuted,
      borderColor: palette.success,
      color: palette.success,
    },
    info: {
      icon: "information-circle-outline" as const,
      backgroundColor: palette.infoSurface ?? palette.surfaceMuted,
      borderColor: palette.border,
      color: palette.textPrimary,
    },
  };

  const currentTone = toneMap[tone];

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: currentTone.backgroundColor,
          borderColor: currentTone.borderColor,
        },
      ]}
    >
      <Ionicons name={currentTone.icon} size={18} color={currentTone.color} />
      <Text style={[styles.bannerText, { color: currentTone.color }]}>
        {children}
      </Text>
    </View>
  );
};

export const AuthActions = ({ children }: AuthActionsProps) => {
  return <Stack gap="sm">{children}</Stack>;
};

export const AuthDivider = ({ label = "or" }: AuthDividerProps) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
      <Text style={[styles.dividerLabel, { color: palette.textSecondary }]}>
        {label}
      </Text>
      <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
    </View>
  );
};

export const AuthFooterLink = ({
  prefix,
  actionLabel,
  onPress,
}: AuthFooterLinkProps) => {
  const { palette } = useThemeContext();

  return (
    <Pressable onPress={onPress} style={styles.footerLinkWrap}>
      <Text style={[styles.footerText, { color: palette.textSecondary }]}>
        {prefix ? `${prefix} ` : ""}
        <Text style={[styles.footerAction, { color: palette.primary }]}>
          {actionLabel}
        </Text>
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    justifyContent: "center",
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -88,
    right: -72,
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.8,
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: -96,
    left: -84,
    width: 260,
    height: 260,
    borderRadius: 999,
    opacity: 0.55,
  },
  hero: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  heroIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    lineHeight: 34,
    fontWeight: theme.typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
  },
  progressWrap: {
    minWidth: 92,
    alignItems: "flex-end",
    gap: theme.spacing.xxs,
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  progressTrack: {
    width: 92,
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: theme.spacing.lg,
    shadowColor: "#142312",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  bannerText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    fontWeight: theme.typography.fontWeight.medium,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  footerLinkWrap: {
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  footerText: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  footerAction: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
