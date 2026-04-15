import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Row, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: number;
  disabled?: boolean;
  label?: string;
  helperText?: string;
};

export const StarRatingInput = ({
  value,
  onChange,
  max = 5,
  size = 28,
  disabled = false,
  label,
  helperText,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: palette.textPrimary }]}>{label}</Text>
      ) : null}

      <Row gap="xs" align="center">
        {Array.from({ length: max }, (_, index) => {
          const starValue = index + 1;
          const filled = starValue <= value;

          return (
            <Pressable
              key={starValue}
              accessibilityRole="button"
              accessibilityLabel={`Set rating to ${starValue}`}
              disabled={disabled}
              hitSlop={8}
              onPress={() => onChange(starValue)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons
                name={filled ? "star" : "star-outline"}
                size={size}
                color={filled ? palette.warning ?? "#F59E0B" : palette.textMuted}
              />
            </Pressable>
          );
        })}
      </Row>

      {helperText ? (
        <Text style={[styles.helperText, { color: palette.textSecondary }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
});
