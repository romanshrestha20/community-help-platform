import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  firstName: string;
  openCount: number;
  locationLabel: string;
};

export const HomeDashboardHeader = ({ firstName, openCount, locationLabel }: Props) => {
  const { palette } = useThemeContext();

  return (
    <View>
      <Text style={[styles.title, { color: palette.textPrimary }]}>Good morning, {firstName} 👋</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        {openCount} open requests nearby in {locationLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
  },
});
