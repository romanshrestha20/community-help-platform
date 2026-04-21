import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { Screen, theme } from "@/design-system";
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

  const heroAnim = useRef(new Animated.Value(0)).current;
  const flowAnim = useRef(new Animated.Value(0)).current;
  const actionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    ]).start();
  }, [actionAnim, flowAnim, heroAnim]);

  const heroIllustration =
    colorScheme === "dark"
      ? {
          panel: "#202520",
          base: "#1F2A22",
          curveA: "#284635",
          curveB: "#203E48",
          signalFill: "rgba(36,39,36,0.96)",
          avatarFill: "rgba(36,39,36,0.96)",
        }
      : {
          panel: palette.surfaceMuted,
          base: "#DCEAD9",
          curveA: "#BDD8BC",
          curveB: "#CBE3C6",
          signalFill: "rgba(255,255,255,0.96)",
          avatarFill: "rgba(255,255,255,0.96)",
        };

  const dividerColor =
    colorScheme === "dark"
      ? "rgba(166,179,166,0.16)"
      : "rgba(84,100,79,0.16)";

  return (
    <Screen
      withTabBarSpacing={false}
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: palette.background },
      ]}
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.shell}>
          <View
            style={[
              styles.surface,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.heroSection,
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
                  <Text style={[styles.brandName, { color: palette.textPrimary }]}>
                    Community Support
                  </Text>
                  <Text
                    style={[styles.brandSubline, { color: palette.textSecondary }]}
                  >
                    Nearby help, trusted replies, and simple coordination.
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.visualPanel,
                  {
                    backgroundColor: heroIllustration.panel,
                    borderColor: palette.border,
                  },
                ]}
              >
                <View style={styles.mapFrame}>
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
                      {
                        backgroundColor: "#1F7A58",
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
                    <Ionicons name="location" size={16} color="#FFFFFF" />
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.pin,
                      styles.pinTwo,
                      {
                        backgroundColor: "#C46A2D",
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
                    <Ionicons name="briefcase" size={14} color="#FFFFFF" />
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.pin,
                      styles.pinThree,
                      {
                        backgroundColor: "#3656D4",
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
                    <Ionicons name="chatbubble" size={13} color="#FFFFFF" />
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
                    <View style={[styles.avatarDot, { backgroundColor: "#F0B27A" }]} />
                    <View style={[styles.avatarDot, { backgroundColor: "#7BC6A4" }]} />
                    <View style={[styles.avatarDot, { backgroundColor: "#8FA8FF" }]} />
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
                    tone="#1F7A58"
                    fill={colorScheme === "dark" ? "#223528" : "#E4F2EA"}
                  />
                  <TrustBadge
                    icon="time-outline"
                    label="Fast coordination"
                    tone="#B87617"
                    fill={colorScheme === "dark" ? "#392E1E" : "#FFF2DD"}
                  />
                </View>

                <Text style={[styles.headline, { color: palette.textPrimary }]}>
                  Find or offer help nearby.
                </Text>

                <Text
                  style={[styles.subheadline, { color: palette.textSecondary }]}
                >
                  Create your account, set your location, and start posting
                  requests or helping people in your community.
                </Text>

                <View style={styles.proofRow}>
                  <Ionicons name="star" size={15} color="#C46A2D" />
                  <Text style={[styles.proofText, { color: palette.textSecondary }]}>
                    Simple onboarding, nearby discovery, and messaging built into one flow.
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.flowBlock,
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
                accent="#1F7A58"
                textPrimary={palette.textPrimary}
                textSecondary={palette.textSecondary}
                divider={dividerColor}
                showDivider
              />

              <StepRow
                icon="location-outline"
                title="Set your location"
                body="Use your current location or search your city manually."
                accent="#C46A2D"
                textPrimary={palette.textPrimary}
                textSecondary={palette.textSecondary}
                divider={dividerColor}
                showDivider
              />

              <StepRow
                icon="camera-outline"
                title="Add a profile photo"
                body="Build trust with a photo, then start browsing or posting requests."
                accent="#3656D4"
                textPrimary={palette.textPrimary}
                textSecondary={palette.textSecondary}
                divider={dividerColor}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.actionBlock,
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
                  {
                    backgroundColor: palette.primary,
                    opacity: pressed ? 0.94 : 1,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                  },
                ]}
              >
                <Text
                  style={[styles.primaryCtaText, { color: palette.textInverse }]}
                >
                  Create account
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={palette.textInverse}
                />
              </Pressable>

              <Text style={[styles.primaryMeta, { color: palette.textSecondary }]}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  shell: {
    flex: 1,
    justifyContent: "center",
  },
  surface: {
    borderWidth: 1,
    borderRadius: 30,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
    shadowColor: "#122013",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  heroSection: {
    gap: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  brandCopy: {
    flex: 1,
  },
  brandName: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  brandSubline: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  visualPanel: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 12,
  },
  mapFrame: {
    height: 220,
    borderRadius: 22,
    overflow: "hidden",
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
    shadowColor: "#122013",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  pinOne: {
    top: 54,
    left: 52,
  },
  pinTwo: {
    top: 118,
    right: 84,
  },
  pinThree: {
    bottom: 42,
    left: 142,
  },
  signalCard: {
    position: "absolute",
    right: 16,
    top: 16,
    minWidth: 126,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  signalCardLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  signalCardValue: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
  },
  avatarCluster: {
    position: "absolute",
    left: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatarDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginRight: -6,
  },
  avatarLabel: {
    marginLeft: 12,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    flexShrink: 1,
  },
  copyBlock: {
    gap: 12,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  trustBadge: {
    minHeight: 34,
    borderRadius: theme.radius.fill,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 12,
  },
  trustBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  headline: {
    fontSize: 33,
    lineHeight: 37,
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  subheadline: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    maxWidth: "96%",
  },
  proofRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  proofText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  flowBlock: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  flowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
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
    paddingVertical: 10,
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCopy: {
    flex: 1,
    paddingTop: 1,
  },
  stepTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    marginBottom: 3,
  },
  stepBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  stepDivider: {
    height: 1,
    marginLeft: 50,
  },
  actionBlock: {
    paddingTop: 18,
    gap: 10,
  },
  primaryCta: {
    minHeight: 58,
    borderRadius: theme.radius.fill,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 10,
    shadowColor: "#1D6A46",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: "800",
  },
  primaryMeta: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  signInLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 6,
    minHeight: 42,
  },
  signInLabel: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  signInAction: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
  },
});