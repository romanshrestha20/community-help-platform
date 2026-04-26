import React, { useEffect, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { ScreenView, theme } from "@/design-system";
import { APP_ROUTES } from "@/config/routes";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type TrustBadgeProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: string;
  fill: string;
};

function TrustBadge({ icon, label, tone, fill }: TrustBadgeProps) {
  return (
    <View style={[styles.trustBadge, { backgroundColor: fill }]}>
      <Ionicons name={icon} size={15} color={tone} />
      <Text style={[styles.trustBadgeText, { color: tone }]}>{label}</Text>
    </View>
  );
}

type StepRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  divider: string;
  showDivider?: boolean;
};

function StepRow({
  icon,
  title,
  body,
  accent,
  textPrimary,
  textSecondary,
  divider,
  showDivider = false,
}: StepRowProps) {
  return (
    <View style={styles.stepRowWrap}>
      <View style={styles.stepRow}>
        <View style={[styles.stepIconWrap, { backgroundColor: `${accent}14` }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>

        <View style={styles.stepCopy}>
          <Text style={[styles.stepTitle, { color: textPrimary }]}>{title}</Text>
          <Text style={[styles.stepBody, { color: textSecondary }]}>{body}</Text>
        </View>
      </View>

      {showDivider ? (
        <View style={[styles.stepDivider, { backgroundColor: divider }]} />
      ) : null}
    </View>
  );
}

export default function EntryScreen() {
  const router = useRouter();
  const { palette, colorScheme } = useThemeContext();
  const { height } = useWindowDimensions();
  const isCompactHeight = height < 700;

  const heroAnim = useRef(new Animated.Value(0)).current;
  const flowAnim = useRef(new Animated.Value(0)).current;
  const actionAnim = useRef(new Animated.Value(0)).current;

  // Manual splash screen control
  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
    Animated.stagger(110, [
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(flowAnim, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(actionAnim, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      SplashScreen.hideAsync();
    });
  }, [actionAnim, flowAnim, heroAnim]);

  const heroIllustration =
    colorScheme === "dark"
      ? {
        panel: palette.surfaceSecondary,
        base: palette.primaryLight,
        curveA: palette.primaryMid,
        curveB: palette.infoLight,
        signalFill: palette.surface,
        avatarFill: palette.surface,
      }
      : {
        panel: palette.surfaceSecondary,
        base: palette.primaryLight,
        curveA: "#C8DDD0",
        curveB: "#D7E5D8",
        signalFill: palette.surface,
        avatarFill: palette.surface,
      };

  const dividerColor =
    colorScheme === "dark"
      ? palette.borderStrong
      : palette.border;

  return (
    <ScreenView
      withTabBarSpacing={false}
      style={[
        styles.screenContent,
        { backgroundColor: palette.background },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.shell}>
          <View
            style={[
              styles.surface,
              isCompactHeight && styles.surfaceCompact,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.heroSection,
                isCompactHeight && styles.heroSectionCompact,
                {
                  opacity: heroAnim,
                  transform: [
                    {
                      translateY: heroAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.brandRow}>
                <View
                  style={[
                    styles.brandMark,
                    isCompactHeight && styles.brandMarkCompact,
                    { backgroundColor: `${palette.primary}15` },
                  ]}
                >
                  <Ionicons
                    name="people-circle-outline"
                    size={28}
                    color={palette.primary}
                  />
                </View>

                <View style={styles.brandCopy}>
                  <Text style={[styles.brandName, isCompactHeight && styles.brandNameCompact, { color: palette.textPrimary }]}>
                    Community Support
                  </Text>
                  <Text
                    style={[styles.brandSubline, isCompactHeight && styles.brandSublineCompact, { color: palette.textSecondary }]}
                  >
                    Nearby help, trusted replies, and simple coordination.
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.visualPanel,
                  isCompactHeight && styles.visualPanelCompact,
                  {
                    backgroundColor: heroIllustration.panel,
                    borderColor: palette.border,
                  },
                ]}
              >
                <View style={[styles.mapFrame, isCompactHeight && styles.mapFrameCompact]}>
                  <View
                    style={[
                      styles.mapLayerBase,
                      { backgroundColor: heroIllustration.base },
                    ]}
                  />
                  <View
                    style={[
                      styles.mapLayerCurveA,
                      { backgroundColor: heroIllustration.curveA },
                    ]}
                  />
                  <View
                    style={[
                      styles.mapLayerCurveB,
                      { backgroundColor: heroIllustration.curveB },
                    ]}
                  />

                  <Animated.View
                    style={[
                      styles.pin,
                      styles.pinOne,
                      isCompactHeight && styles.pinOneCompact,
                      {
                        backgroundColor: palette.primary,
                        transform: [
                          {
                            translateY: heroAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [10, 0],
                            }),
                          },
                          {
                            scale: heroAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Ionicons name="location" size={16} color={palette.textInverse} />
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.pin,
                      styles.pinTwo,
                      isCompactHeight && styles.pinTwoCompact,
                      {
                        backgroundColor: palette.secondary,
                        transform: [
                          {
                            translateY: heroAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [14, 0],
                            }),
                          },
                          {
                            scale: heroAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.88, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Ionicons name="briefcase" size={14} color={palette.textInverse} />
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.pin,
                      styles.pinThree,
                      isCompactHeight && styles.pinThreeCompact,
                      {
                        backgroundColor: palette.info,
                        transform: [
                          {
                            translateY: heroAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [18, 0],
                            }),
                          },
                          {
                            scale: heroAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.86, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Ionicons name="chatbubble" size={13} color={palette.textInverse} />
                  </Animated.View>

                  <View
                    style={[
                      styles.signalCard,
                      {
                        backgroundColor: heroIllustration.signalFill,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.signalCardLabel,
                        { color: palette.textSecondary },
                      ]}
                    >
                      Nearby now
                    </Text>
                    <Text
                      style={[
                        styles.signalCardValue,
                        { color: palette.textPrimary },
                      ]}
                    >
                      12 open requests
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.avatarCluster,
                      {
                        backgroundColor: heroIllustration.avatarFill,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <View style={[styles.avatarDot, { backgroundColor: palette.secondary }]} />
                    <View style={[styles.avatarDot, { backgroundColor: palette.primaryMid }]} />
                    <View style={[styles.avatarDot, { backgroundColor: palette.info }]} />
                    <Text style={[styles.avatarLabel, { color: palette.textPrimary }]}>
                      Local helpers replying
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.copyBlock}>
                <View style={styles.badgeRow}>
                  <TrustBadge
                    icon="shield-checkmark-outline"
                    label="Trusted locally"
                    tone={palette.primary}
                    fill={palette.primaryLight}
                  />
                  <TrustBadge
                    icon="time-outline"
                    label="Fast coordination"
                    tone={palette.secondary}
                    fill={palette.secondaryLight}
                  />
                </View>

                <Text style={[styles.headline, isCompactHeight && styles.headlineCompact, { color: palette.textPrimary }]}>
                  Find or offer help nearby.
                </Text>

                <Text
                  style={[styles.subheadline, isCompactHeight && styles.subheadlineCompact, { color: palette.textSecondary }]}
                >
                  Create your account, set your location, and start posting
                  requests or helping people in your community.
                </Text>

                <View style={styles.proofRow}>
                  <Ionicons name="star" size={15} color={palette.star} />
                  <Text style={[styles.proofText, { color: palette.textSecondary }]}>
                    Simple onboarding, nearby discovery, and messaging built into one flow.
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.flowBlock,
                isCompactHeight && styles.flowBlockCompact,
                {
                  backgroundColor: palette.surfaceMuted,
                  borderColor: palette.border,
                  opacity: flowAnim,
                  transform: [
                    {
                      translateY: flowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.flowHeader}>
                <Text style={[styles.flowEyebrow, { color: palette.textSecondary }]}>
                  How it works
                </Text>
                <Text style={[styles.flowMeta, { color: palette.primary }]}>
                  3 quick steps
                </Text>
              </View>

              <StepRow
                icon="person-add-outline"
                title="Create your account"
                body="Add your name, email, password, and complete a quick setup."
                accent={palette.primary}
                textPrimary={palette.textPrimary}
                textSecondary={palette.textSecondary}
                divider={dividerColor}
                showDivider
              />

              <StepRow
                icon="location-outline"
                title="Set your location"
                body="Use your current location or search your city manually."
                accent={palette.secondary}
                textPrimary={palette.textPrimary}
                textSecondary={palette.textSecondary}
                divider={dividerColor}
                showDivider
              />

              <StepRow
                icon="camera-outline"
                title="Add a profile photo"
                body="Build trust with a photo, then start browsing or posting requests."
                accent={palette.info}
                textPrimary={palette.textPrimary}
                textSecondary={palette.textSecondary}
                divider={dividerColor}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.actionBlock,
                isCompactHeight && styles.actionBlockCompact,
                {
                  opacity: actionAnim,
                  transform: [
                    {
                      translateY: actionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Pressable
                onPress={() => router.push(APP_ROUTES.AUTH_REGISTER)}
                style={({ pressed }) => [
                  styles.primaryCta,
                  isCompactHeight && styles.primaryCtaCompact,
                  {
                    backgroundColor: palette.primary,
                    opacity: pressed ? 0.94 : 1,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                  },
                ]}
              >
                <Text
                  style={[styles.primaryCtaText, isCompactHeight && styles.primaryCtaTextCompact, { color: palette.textInverse }]}
                >
                  Create account
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={palette.textInverse}
                />
              </Pressable>

              <Text style={[styles.primaryMeta, isCompactHeight && styles.primaryMetaCompact, { color: palette.textSecondary }]}>
                Takes less than a minute to get started.
              </Text>

              <Pressable
                onPress={() => router.push(APP_ROUTES.AUTH_LOGIN)}
                style={({ pressed }) => [
                  styles.signInLink,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Text style={[styles.signInLabel, { color: palette.textSecondary }]}>
                  Already have an account?
                </Text>
                <Text style={[styles.signInAction, { color: palette.primary }]}>
                  Sign in
                </Text>
                <Ionicons name="arrow-forward" size={14} color={palette.primary} />
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  shell: {
    flexGrow: 1,
    justifyContent: "center",
  },
  surface: {
    minHeight: "100%",
    borderWidth: 1,
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: "#162018",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  actionBlock: {
    paddingTop: 12,
    gap: 8,
    marginTop: 12,
  },

  surfaceCompact: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  heroSection: {
    gap: 12,
  },
  heroSectionCompact: {
    gap: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkCompact: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  brandCopy: {
    flex: 1,
  },
  brandName: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  brandNameCompact: {
    fontSize: 17,
    lineHeight: 21,
  },
  brandSubline: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  brandSublineCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
  visualPanel: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 10,
  },
  visualPanelCompact: {
    padding: 8,
    borderRadius: 18,
  },
  mapFrame: {
    height: 176,
    borderRadius: 18,
    overflow: "hidden",
  },
  mapFrameCompact: {
    height: 138,
    borderRadius: 14,
  },
  mapLayerBase: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLayerCurveA: {
    position: "absolute",
    left: -20,
    right: 90,
    top: 88,
    height: 90,
    borderRadius: 999,
    transform: [{ rotate: "-12deg" }],
  },
  mapLayerCurveB: {
    position: "absolute",
    left: 120,
    right: -10,
    top: 40,
    height: 84,
    borderRadius: 999,
    transform: [{ rotate: "16deg" }],
  },
  pin: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#162018",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  pinOne: {
    top: 54,
    left: 52,
  },
  pinOneCompact: {
    top: 38,
    left: 36,
  },
  pinTwo: {
    top: 118,
    right: 84,
  },
  pinTwoCompact: {
    top: 82,
    right: 58,
  },
  pinThree: {
    bottom: 42,
    left: 142,
  },
  pinThreeCompact: {
    bottom: 24,
    left: 100,
  },
  signalCard: {
    position: "absolute",
    right: 12,
    top: 12,
    minWidth: 112,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signalCardLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  signalCardValue: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
  },
  avatarCluster: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  avatarDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#FFFDFC",
    marginRight: -6,
  },
  avatarLabel: {
    marginLeft: 10,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  copyBlock: {
    gap: 10,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  trustBadge: {
    minHeight: 30,
    borderRadius: theme.radius.fill,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 10,
  },
  trustBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  headline: {
    fontSize: 28,
    lineHeight: 31,
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  headlineCompact: {
    fontSize: 24,
    lineHeight: 27,
  },
  subheadline: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    maxWidth: "100%",
  },
  subheadlineCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  proofRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  proofText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  flowBlock: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  flowBlockCompact: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  flowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  flowEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  flowMeta: {
    fontSize: 12,
    fontWeight: "800",
  },
  stepRowWrap: {
    width: "100%",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 12,
    paddingVertical: 7,
  },
  stepIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCopy: {
    flex: 1,
    paddingTop: 1,
  },
  stepTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  stepBody: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  stepDivider: {
    height: 1,
    marginLeft: 46,
  },
  actionBlock: {
    paddingTop: 12,
    gap: 8,
    marginTop: "auto",
  },
  actionBlockCompact: {
    paddingTop: 10,
    gap: 6,
  },
  primaryCta: {
    minHeight: 52,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 10,
    shadowColor: "#28483B",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  primaryCtaCompact: {
    minHeight: 48,
  },
  primaryCtaText: {
    fontSize: 15,
    fontWeight: "800",
  },
  primaryCtaTextCompact: {
    fontSize: 14,
  },
  primaryMeta: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
  primaryMetaCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
  signInLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 6,
    minHeight: 36,
  },
  signInLabel: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  signInAction: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
});
