import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Slider, Theme, XStack } from "tamagui";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

export type DistanceOption = "ANY" | "1" | "5" | "10" | "25";
export type RequestType = "ALL" | "PAID" | "UNPAID" | "URGENT_ONLY";
export type SortBy = "NEAREST" | "NEWEST" | "BUDGET";

export type RequestFilterValue = {
  category: string;
  distance: DistanceOption;
  requestType: RequestType;
  sortBy: SortBy;
};

type Props = {
  value: RequestFilterValue;
  categories: string[];
  activeCount: number;
  onChange: (next: RequestFilterValue) => void;
  onApply: () => void;
  onClear: () => void;
};

const DISTANCE_OPTIONS: { label: string; value: Exclude<DistanceOption, "ANY"> }[] = [
  { label: "Within 1 km", value: "1" },
  { label: "Within 5 km", value: "5" },
  { label: "Within 10 km", value: "10" },
  { label: "Within 25 km", value: "25" },
];

const distanceToIndex = (value: DistanceOption) => {
  if (value === "ANY") return 0;
  const idx = DISTANCE_OPTIONS.findIndex((item) => item.value === value);
  return Math.max(0, idx);
};

const SectionTitle = ({ label }: { label: string }) => {
  const { palette } = useThemeContext();
  return <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>{label}</Text>;
};

const FilterOption = ({
  label,
  active,
  onPress,
  half = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  half?: boolean;
}) => {
  const { palette } = useThemeContext();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        half ? styles.optionHalf : null,
        {
          backgroundColor: active ? `${palette.primary}24` : palette.surfaceMuted,
          borderColor: active ? palette.primary : palette.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Text style={[styles.optionText, { color: active ? palette.textPrimary : palette.textSecondary }]}>{label}</Text>
      {active ? (
        <View style={[styles.checkWrap, { backgroundColor: `${palette.primary}33` }]}>
          <Ionicons name="checkmark" size={14} color={palette.textPrimary} />
        </View>
      ) : null}
    </Pressable>
  );
};

export const RightRequestFilterSidebar = ({
  value,
  categories,
  activeCount,
  onChange,
  onApply,
  onClear,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <View style={[styles.wrap, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Filters</Text>
        <Pressable style={styles.resetRow} onPress={onClear}>
          <Text style={[styles.resetText, { color: palette.primary }]}>Reset</Text>
          <Ionicons name="refresh" size={17} color={palette.primary} />
        </Pressable>
      </View>
      <View style={styles.activeRow}>
        <View style={[styles.activeDot, { backgroundColor: palette.primary }]} />
        <Text style={[styles.activeCount, { color: palette.textSecondary }]}>
          {activeCount} active filter{activeCount === 1 ? "" : "s"}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />
      <SectionTitle label="Categories" />
      <View style={[styles.group, styles.gridGroup]}>
        {categories.map((item) => (
          <FilterOption
            key={item}
            label={item}
            active={value.category === item}
            onPress={() => onChange({ ...value, category: item })}
            half={item !== "Moving"}
          />
        ))}
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />
      <SectionTitle label="Distance" />
      <View style={styles.group}>
        <View style={[styles.distanceRow, styles.gridGroup]}>
          {DISTANCE_OPTIONS.map((item) => (
            <FilterOption
              key={item.value}
              label={item.label}
              active={value.distance === item.value}
              onPress={() => onChange({ ...value, distance: item.value })}
              half
            />
          ))}
        </View>
        <XStack alignItems="center">
          <Theme name="light">
            <Slider
              value={[distanceToIndex(value.distance)]}
              min={0}
              max={DISTANCE_OPTIONS.length - 1}
              step={1}
              width="100%"
              onValueChange={(next) => {
                const idx = Math.round(next[0] ?? 0);
                const selected = DISTANCE_OPTIONS[idx];
                if (selected) {
                  onChange({ ...value, distance: selected.value });
                }
              }}
            >
              <Slider.Track backgroundColor={palette.surface} borderColor={palette.border} borderWidth={1}>
                <Slider.TrackActive backgroundColor={palette.primary} />
              </Slider.Track>
              <Slider.Thumb circular size="$2" backgroundColor={palette.primary} borderColor={palette.surface} borderWidth={2} />
            </Slider>
          </Theme>
        </XStack>
        <View style={styles.distanceScale}>
          {DISTANCE_OPTIONS.map((item) => (
            <Text key={`scale-${item.value}`} style={[styles.scaleLabel, { color: palette.textMuted }]}>
              {item.value} km
            </Text>
          ))}
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />
      <SectionTitle label="Request Type" />
      <View style={[styles.group, styles.gridGroup]}>
        <FilterOption label="Paid" active={value.requestType === "PAID"} onPress={() => onChange({ ...value, requestType: "PAID" })} />
        <FilterOption label="Unpaid" active={value.requestType === "UNPAID"} onPress={() => onChange({ ...value, requestType: "UNPAID" })} />
        <FilterOption
          label="Urgent only"
          active={value.requestType === "URGENT_ONLY"}
          onPress={() => onChange({ ...value, requestType: "URGENT_ONLY" })}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />
      <SectionTitle label="Sort By" />
      <View style={[styles.group, styles.gridGroup]}>
        <FilterOption label="Nearest" active={value.sortBy === "NEAREST"} onPress={() => onChange({ ...value, sortBy: "NEAREST" })} />
        <FilterOption label="Newest" active={value.sortBy === "NEWEST"} onPress={() => onChange({ ...value, sortBy: "NEWEST" })} />
        <FilterOption label="Budget" active={value.sortBy === "BUDGET"} onPress={() => onChange({ ...value, sortBy: "BUDGET" })} />
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />
      <View style={styles.footer}>
        <AppButton
          title="Apply filters"
          onPress={onApply}
          icon={<Ionicons name="options-outline" size={16} color={palette.textInverse} />}
        />
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  resetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resetText: {
    fontSize: 12,
    fontWeight: "700",
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  activeCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: 2,
  },
  group: {
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  gridGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  distanceRow: {
    gap: 8,
  },
  distanceScale: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  scaleLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  option: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionHalf: {
    width: "48.6%",
  },
  checkWrap: {
    width: 20,
    height: 20,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    marginTop: "auto",
    gap: 8,
    paddingTop: 2,
  },
});
