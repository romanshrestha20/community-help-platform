import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = React.ComponentProps<typeof TextInput> & {
  label?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
};

export const AppInput = ({ label, error, containerStyle, ...props }: Props) => {
  const { palette } = useThemeContext();
  const [isFocused, setIsFocused] = useState(false);

  const {
    style,
    onFocus,
    onBlur,
    multiline,
    ...restProps
  } = props;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: palette.textPrimary }]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: error
              ? palette.danger
              : isFocused
                ? palette.primary
                : palette.border,
            backgroundColor: palette.surface,
            shadowColor: palette.textPrimary,
          },
          isFocused && styles.inputContainerFocused,
        ]}
      >
        <TextInput
          {...restProps}
          multiline={multiline}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            {
              color: palette.textPrimary,
            },
            style,
          ]}
          placeholderTextColor={palette.textSecondary}
        />
      </View>
      {error && <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: 0.2,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    minHeight: 46,
    justifyContent: "center",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  inputContainerFocused: {
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  input: {
    padding: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  error: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
});