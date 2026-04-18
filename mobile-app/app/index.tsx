import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { Screen, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { APP_ROUTES } from "@/config/routes";

type FeatureRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconTone: string;
  iconBg: string;
  title: string;
  subtitle: string;
};

function FeatureRow({
  icon,
  iconTone,
  iconBg,
  title,
  subtitle,
}: FeatureRowProps) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={28} color={iconTone} />
      </View>

      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

export default function EntryScreen() {
  const router = useRouter();
  const { palette } = useThemeContext();

  return (
    <Screen
      withTabBarSpacing={false}
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: palette.background },
      ]}
    >
      <View
        style={[
          styles.surface,
          {
            backgroundColor: palette.surface,
            shadowColor: "#182219",
          },
        ]}
      >
        <View
          style={[
            styles.statusPill,
            { backgroundColor: "#E3F0E8" },
          ]}
        >
          <Ionicons name="time-outline" size={20} color={palette.primary} />
          <Text style={[styles.statusText, { color: palette.primary }]}>
            Available in your area
          </Text>
        </View>

        <View style={styles.heroBlock}>
          <Text style={[styles.headline, { color: palette.textPrimary }]}>
            Your{" "}
            <Text style={[styles.headlineAccent, { color: palette.primary }]}>
              neighborhood
            </Text>
            , helping{"\n"}each other.
          </Text>

          <Text style={[styles.subheadline, { color: palette.textSecondary }]}>
            Post requests, find helpers nearby, get things done together.
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureRow
            icon="location-outline"
            iconTone="#1F7A58"
            iconBg="#E5F2EC"
            title="Location-based discovery"
            subtitle="Browse requests near you, help your neighbors."
          />

          <FeatureRow
            icon="card-outline"
            iconTone="#B87700"
            iconBg="#FFF1D8"
            title="Post & manage requests"
            subtitle="Moving, repairs, tech help — any category."
          />

          <FeatureRow
            icon="chatbox-ellipses-outline"
            iconTone="#4F46E5"
            iconBg="#E8EBFF"
            title="Bid, chat, get paid"
            subtitle="Seamless bidding and messaging in one place."
          />
        </View>

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
          <Text style={[styles.primaryCtaText, { color: palette.textInverse }]}>
            Get started
          </Text>
        </Pressable>

        <View style={styles.signInRow}>
          <Text style={[styles.signInText, { color: palette.textSecondary }]}>
            Already have an account?{" "}
          </Text>
          <Pressable onPress={() => router.push(APP_ROUTES.AUTH_LOGIN)}>
            <Text style={[styles.signInLink, { color: palette.primary }]}>
              Sign in
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "flex-start",
  },
  surface: {
    flex: 1,
    width: "100%",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingHorizontal: 32,
    paddingTop: 50,
    paddingBottom: 28,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  statusPill: {
    alignSelf: "flex-start",
    minHeight: 46,
    borderRadius: theme.radius.fill,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    paddingHorizontal: 20,
    marginBottom: 46,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "700",
  },
  heroBlock: {
    marginBottom: 34,
  },
  headline: {
    fontSize: 52,
    lineHeight: 60,
    fontWeight: "800",
    letterSpacing: -1.4,
    marginBottom: 24,
  },
  headlineAccent: {
    fontWeight: "800",
  },
  subheadline: {
    fontSize: 22,
    lineHeight: 34,
    fontWeight: "500",
    maxWidth: "96%",
  },
  features: {
    gap: 24,
    marginBottom: 48,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 20,
  },
  featureIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
    paddingTop: 4,
  },
  featureTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#1E1F1D",
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "500",
    color: "#5B5F59",
  },
  primaryCta: {
    minHeight: 84,
    borderRadius: theme.radius.fill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#226F49",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  primaryCtaText: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
  },
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  signInText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "500",
  },
  signInLink: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
  },
});
