import React from "react";
import { Text, View, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/design-system";

type ProfileDateFieldProps = {
  value?: string;
  showDatePicker: boolean;
  onPress: () => void;
  onChange: (_event: unknown, selectedDate?: Date) => void;
};

export const ProfileDateField = ({ value, showDatePicker, onPress, onChange }: ProfileDateFieldProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Date of Birth:</Text>
      <AppButton title={value || "Select Date"} onPress={onPress} />
      {showDatePicker && (
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
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
