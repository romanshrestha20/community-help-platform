import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { ProfileAvatar } from "@/features/user/components/ProfileAvatar";
import { useThemeStore } from "@/features/settings/store/theme.store";

type WebNavLocationOption = {
  id: string;
  label: string;
};

type Props = {
  locationLabel: string;
  globalSearchQuery: string;
  onChangeGlobalSearch: (value: string) => void;
  onPostRequest: () => void;
  onSubmitGlobalSearch?: (query: string) => void;
  onToggleSidebar?: () => void;
  onPressHome?: () => void;
  onPressLocation?: () => void;
  onPressNotifications?: () => void;
  onPressMessages?: () => void;
  onPressProfile?: () => void;
  onPressSettings?: () => void;
  onPressLogout?: () => void;
  fullName?: string;
  avatarUrl?: string | null;
  notificationBadgeCount?: number;
  locationOptions?: WebNavLocationOption[];
  selectedLocationId?: string | null;
  onSelectLocation?: (optionId: string) => void;
  onUseCurrentLocation?: () => void;
};

export const WebTopNav = ({
  locationLabel,
  globalSearchQuery,
  onChangeGlobalSearch,
  onPostRequest,
  onSubmitGlobalSearch,
  onToggleSidebar,
  onPressHome,
  onPressLocation,
  onPressNotifications,
  onPressMessages,
  onPressProfile,
  onPressSettings,
  onPressLogout,
  fullName,
  avatarUrl,
  notificationBadgeCount = 1,
  locationOptions = [],
  selectedLocationId = null,
  onSelectLocation,
  onUseCurrentLocation,
}: Props) => {
  const { palette } = useThemeContext();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const themeMode = useThemeStore((state) => state.themeMode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const effectiveThemeMode = useMemo(
    () => (themeMode === "light" ? "light" : "dark"),
    [themeMode]
  );
  const isDark = effectiveThemeMode === "dark";

  return (
    <View
      style={[
        styles.navbar,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          shadowColor: "#000000",
          shadowOpacity: isDark ? 0.22 : 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 2 },
        },
      ]}
    >
      <View style={styles.navInner}>
        {onToggleSidebar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle sidebar"
            onPress={onToggleSidebar}
            style={({ pressed }) => [
              styles.menuButton,
              {
                backgroundColor: pressed ? palette.surfaceMuted : palette.surface,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <Ionicons name="menu-outline" size={20} color={palette.textPrimary} />
          </Pressable>
        ) : null}

        <Pressable onPress={onPressHome} style={styles.brandWrap}>
          <Ionicons name="heart-circle" size={26} color={palette.primary} />
          <Text style={[styles.brandText, { color: palette.textPrimary }]}>NearHelp</Text>
        </Pressable>

        <View style={styles.leftCluster}>
          <View style={[styles.searchWrap, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
            <Ionicons name="search-outline" size={18} color={palette.textSecondary} />
            <TextInput
              value={globalSearchQuery}
              onChangeText={onChangeGlobalSearch}
              placeholder="Global search: requests, messages, people"
              placeholderTextColor={palette.textMuted}
              returnKeyType="search"
              onSubmitEditing={() => onSubmitGlobalSearch?.(globalSearchQuery.trim())}
              style={[styles.searchInput, { color: palette.textPrimary }]}
            />
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.actionsCluster}>
          <View style={styles.locationMenuWrap}>
            <Pressable
              onPress={() => setLocationMenuOpen((open) => !open)}
              style={({ pressed }) => [
                styles.locationPill,
                {
                  backgroundColor: pressed ? palette.surface : palette.surfaceMuted,
                },
              ]}
            >
              <Ionicons name="location-outline" size={14} color={palette.primary} />
              <Text style={[styles.locationText, { color: palette.textSecondary }]}>{locationLabel}</Text>
              <Ionicons name="chevron-down" size={14} color={palette.textSecondary} />
            </Pressable>

            {locationMenuOpen ? (
              <View style={[styles.locationMenu, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                {onUseCurrentLocation ? (
                  <Pressable
                    onPress={() => {
                      setLocationMenuOpen(false);
                      onUseCurrentLocation();
                    }}
                    style={styles.menuItem}
                  >
                    <Text style={[styles.menuItemText, { color: palette.textPrimary }]}>Use current location</Text>
                  </Pressable>
                ) : null}
                {locationOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      setLocationMenuOpen(false);
                      onSelectLocation?.(option.id);
                    }}
                    style={styles.menuItem}
                  >
                    <View style={styles.locationItemRow}>
                      <Text style={[styles.menuItemText, { color: palette.textPrimary }]}>{option.label}</Text>
                      {option.id === selectedLocationId ? (
                        <Ionicons name="checkmark" size={14} color={palette.primary} />
                      ) : null}
                    </View>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => {
                    setLocationMenuOpen(false);
                    onPressLocation?.();
                  }}
                  style={styles.menuItem}
                >
                  <Text style={[styles.menuItemText, { color: palette.primary }]}>Choose on map</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              void setThemeMode(isDark ? "light" : "dark");
            }}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: pressed ? palette.surfaceMuted : palette.surface,
                borderColor: palette.border,
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons
              name={isDark ? "moon-outline" : "sunny-outline"}
              size={17}
              color={palette.textPrimary}
            />
          </Pressable>

          <View style={styles.iconRow}>
            <Pressable
              onPress={onPressNotifications}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: pressed ? palette.surfaceMuted : palette.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="notifications-outline" size={17} color={palette.textPrimary} />
              {notificationBadgeCount > 0 ? (
                <View style={styles.badgeDot} />
              ) : null}
            </Pressable>
          </View>

          <View style={styles.profileMenuWrap}>
            <Pressable
              onPress={() => setProfileMenuOpen((open) => !open)}
              style={[styles.profileButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
            >
              <ProfileAvatar uri={avatarUrl ?? undefined} fullName={fullName} size={34} />
              <Ionicons name="chevron-down" size={14} color={palette.textSecondary} />
            </Pressable>

            {profileMenuOpen ? (
              <View style={[styles.profileMenu, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                <Pressable
                  onPress={() => {
                    setProfileMenuOpen(false);
                    onPressProfile?.();
                  }}
                  style={styles.menuItem}
                >
                  <Text style={[styles.menuItemText, { color: palette.textPrimary }]}>Profile</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setProfileMenuOpen(false);
                    onPressSettings?.();
                  }}
                  style={styles.menuItem}
                >
                  <Text style={[styles.menuItemText, { color: palette.textPrimary }]}>Settings</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setProfileMenuOpen(false);
                    onPressLogout?.();
                  }}
                  style={styles.menuItem}
                >
                  <Text style={[styles.menuItemText, { color: palette.danger }]}>Sign out</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    height: 66,
    borderBottomWidth: 1,
    zIndex: 20,
  },
  navInner: {
    maxWidth: 1440,
    width: "100%",
    marginHorizontal: "auto",
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    height: "100%",
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 174,
  },
  menuButton: {
    width: 38,
    height: 38,
    zIndex: 90,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  leftCluster: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 480,
    maxWidth: 760,
    width: "42%",
  },
  searchWrap: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
    fontFamily: "-apple-system",
  },
  spacer: {
    flex: 1,
  },
  locationPill: {
    height: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationMenuWrap: {
    position: "relative",
  },
  locationMenu: {
    position: "absolute",
    top: 44,
    right: 0,
    minWidth: 220,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    zIndex: 95,
  },
  locationText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "-apple-system",
  },
  actionsCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  postButtonWrap: {
    minWidth: 130,
  },
  iconRow: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  badgeDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  profileMenuWrap: {
    position: "relative",
  },
  profileButton: {
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileMenu: {
    position: "absolute",
    top: 44,
    right: 0,
    minWidth: 148,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    zIndex: 90,
  },
  menuItem: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  locationItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
