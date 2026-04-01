import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type ProfilePickerFieldProps<T extends string> = {
  label: string;
  selectedValue?: T;
  options: T[];
  onValueChange: (value: T) => void;
  marginTop?: number;
  marginBottom?: number;
};

export const ProfilePickerField = <T extends string>({
  label,
  selectedValue,
  options,
  onValueChange,
  marginTop,
  marginBottom = 10,
}: ProfilePickerFieldProps<T>) => {
  const { palette } = useThemeContext();

  const containerStyle = [
    styles.container,
    marginTop !== undefined ? { marginTop } : null,
    marginBottom !== undefined ? { marginBottom } : styles.defaultBottom,
  ];

  return (
    <View style={containerStyle}>
      <Text style={[styles.label, { color: palette.textPrimary }]}>{label}:</Text>
      <Picker
        selectedValue={selectedValue}
        onValueChange={(value) => onValueChange(value as T)}
        style={[styles.picker, { backgroundColor: palette.surface, color: palette.textPrimary }]}
      >
        {options.map((option) => (
          <Picker.Item key={option} label={option} value={option} />
        ))}
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  defaultBottom: {
    marginBottom: theme.spacing.sm,
  },
  label: {
    marginBottom: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  picker: {
    borderRadius: theme.radius.md,
  },
});
