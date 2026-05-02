import React, { forwardRef, useState } from "react";
import { View, TextInput, StyleSheet, StyleProp, ViewStyle, TextInputProps, KeyboardTypeOptions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { FormFieldShell } from "@/components/ui/FormFieldShell";

type Props = Omit<React.ComponentProps<typeof TextInput>, "editable"> & {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightAction?: React.ReactNode;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  returnKeyType?: TextInputProps["returnKeyType"];
  maxLength?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  editable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export const AppInput = forwardRef<TextInput, Props>(({
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  leftIcon,
  rightIcon,
  rightAction,
  containerStyle,
  ...props
}, ref) => {
  const { palette } = useThemeContext();
  const [isFocused, setIsFocused] = useState(false);

  const {
    style,
    onFocus,
    onBlur,
    multiline,
    editable,
    ...restProps
  } = props;
  const isDisabled = disabled || editable === false;

  return (
    <FormFieldShell
      label={label}
      required={required}
      helperText={helperText}
      error={error ?? undefined}
      disabled={isDisabled}
      accessibilityLabel={props.accessibilityLabel ?? label}
      style={StyleSheet.flatten(containerStyle) as ViewStyle}
    >
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
        {leftIcon ? (
          <View style={styles.iconWrap}>
            <Ionicons name={leftIcon} size={18} color={palette.textSecondary} />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          {...restProps}
          multiline={multiline}
          editable={!isDisabled}
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
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
            {
              color: palette.textPrimary,
            },
            style,
          ]}
          placeholderTextColor={palette.textSecondary}
          accessibilityLabel={props.accessibilityLabel ?? label}
          accessibilityHint={props.accessibilityHint}
          accessibilityState={{ disabled: isDisabled }}
        />
        {rightAction ? (
          <View style={styles.iconWrap}>{rightAction}</View>
        ) : rightIcon ? (
          <View style={styles.iconWrap}>
            <Ionicons name={rightIcon} size={18} color={palette.textSecondary} />
          </View>
        ) : null}
      </View>
    </FormFieldShell>
  );
});

AppInput.displayName = "AppInput";

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
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
    flex: 1,
    padding: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  inputWithLeftIcon: {
    paddingLeft: theme.spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: theme.spacing.xs,
  },
  iconWrap: {
    paddingHorizontal: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  inputMultiline: {
    minHeight: 84,
    textAlignVertical: "top",
  },
});
