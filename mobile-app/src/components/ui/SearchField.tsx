import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type SearchFieldProps = Omit<TextInputProps, "style"> & {
  containerStyle?: StyleProp<ViewStyle>;
};

export function SearchField({
  value,
  onChangeText,
  placeholder = "Search",
  containerStyle,
  ...props
}: SearchFieldProps) {
  const { palette } = useThemeContext();
  const [isFocused, setIsFocused] = React.useState(false);
  const hasValue = Boolean(value?.trim());

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.surface,
          borderColor: isFocused ? palette.primary : palette.border,
        },
        containerStyle,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={18}
        color={isFocused ? palette.primary : palette.textMuted}
      />

      <TextInput
        {...props}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textSecondary}
        onFocus={(event) => {
          setIsFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          props.onBlur?.(event);
        }}
        style={[styles.input, { color: palette.textPrimary }]}
      />

      {hasValue ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChangeText?.("")}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons
            name="close-circle"
            size={18}
            color={palette.textMuted}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});
