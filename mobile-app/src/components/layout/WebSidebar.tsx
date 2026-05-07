import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export type SidebarItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
};

export type SidebarSection = {
  key: string;
  label: string;
  items: SidebarItem[];
};

type Props = {
  sections: SidebarSection[];
  activeKey: string;
  collapsed?: boolean;
  trustLabel?: string;
};

export const WebSidebar = ({ sections, activeKey, collapsed = false, trustLabel = "Trusted member" }: Props) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.sidebar,
        {
          width: collapsed ? 80 : 240,
          borderColor: palette.border,
          backgroundColor: palette.surface,
        },
      ]}
    >
      <View style={styles.list}>
        {sections.map((section) => (
          <View key={section.key} style={styles.sectionWrap}>
            {!collapsed ? (
              <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{section.label}</Text>
            ) : null}
            {section.items.map((item) => {
              const active = item.key === activeKey;
              return (
                <Pressable
                  key={item.key}
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.item,
                    {
                      backgroundColor: active
                        ? `${palette.primary}20`
                        : pressed
                          ? palette.surfaceMuted
                          : "transparent",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={17}
                    color={active ? palette.primary : palette.textMuted}
                  />
                  {!collapsed ? (
                    <Text style={[styles.itemText, { color: active ? palette.textPrimary : palette.textSecondary }]}>
                      {item.label}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={[styles.trustBadge, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}>
        <Ionicons name="shield-checkmark" size={16} color={palette.primary} />
        {!collapsed ? <Text style={[styles.trustText, { color: palette.textSecondary }]}>{trustLabel}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 100,
    borderRightWidth: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  list: {
    gap: 10,
  },
  sectionWrap: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    paddingHorizontal: 10,
  },
  item: {
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  itemText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
  },
  trustBadge: {
    marginTop: 12,
    borderWidth: 1,
    minHeight: 42,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trustText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
