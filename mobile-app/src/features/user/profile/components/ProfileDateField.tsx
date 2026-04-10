import React from "react";
import { Text, View, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type ProfileDateFieldProps = {
  value?: string;
  showDatePicker: boolean;
  onPress: () => void;
  onChange: (_event: unknown, selectedDate?: Date) => void;
};

export const ProfileDateField = ({ value, showDatePicker, onPress, onChange }: ProfileDateFieldProps) => {
  const { palette } = useThemeContext();
  const isWeb = Platform.OS === "web";

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: palette.textPrimary }]}>Date of Birth:</Text>
      <AppButton title={value || "Select Date"} onPress={onPress} />
      {!isWeb && showDatePicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={onChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  label: {
    marginBottom: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
