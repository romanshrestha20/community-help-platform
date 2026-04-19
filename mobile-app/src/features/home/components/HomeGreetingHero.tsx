import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DateTime } from "luxon";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";

type Props = {
  firstName: string;
  locationLabel: string;
  requestCount: number;
  avatarUrl?: string | null;
  fullName?: string;
  timeZone?: string;
};

const getGreeting = (timeZone: string) => {
  const hour = DateTime.now().setZone(timeZone).hour;

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
};

export function HomeGreetingHero({
  firstName,
  locationLabel,
  requestCount,
  avatarUrl,
  fullName,
  timeZone = "Europe/Helsinki",
}: Props) {
  const { palette } = useThemeContext();

  const [greeting, setGreeting] = useState(() => getGreeting(timeZone));

  useEffect(() => {
    setGreeting(getGreeting(timeZone));

    const interval = setInterval(() => {
      setGreeting(getGreeting(timeZone));
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [timeZone]);

  const requestText = useMemo(() => {
    return requestCount === 1
      ? "1 open request nearby"
      : `${requestCount} open requests nearby`;
  }, [requestCount]);

  return (
    <View style={styles.headerRow}>
      <View style={styles.greetingWrap}>
        <Text style={[styles.greetingTitle, { color: palette.textPrimary }]}>
          {greeting},{" "}
          <Text style={{ color: palette.primary }}>{firstName}</Text> 👋
        </Text>

        <Text style={[styles.greetingSubtitle, { color: palette.textSecondary }]}>
          {locationLabel} · {requestText}
        </Text>
      </View>

      <View style={styles.avatarWrap}>
        <ProfileAvatar
          uri={avatarUrl}
          fullName={fullName}
          size={70}
        />
        <View
          style={[
            styles.avatarStatusDot,
            {
              borderColor: palette.surface,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: theme.spacing.md,
  },
  greetingWrap: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: -0.6,
  },
  greetingSubtitle: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 24,
    fontWeight: theme.typography.fontWeight.medium,
  },
  avatarWrap: {
    position: "relative",
  },
  avatarStatusDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F07C57",
    borderWidth: 2,
  },
});