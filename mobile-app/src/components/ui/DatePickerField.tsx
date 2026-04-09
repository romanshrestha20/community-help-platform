import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  label?: string;
  error?: string | null;
  value: string; // YYYY-MM-DD format
  onChangeText: (value: string) => void;
};

export const DatePickerField = ({ label, error, value, onChangeText }: Props) => {
  const { palette } = useThemeContext();
  const [showPicker, setShowPicker] = useState(false);

  // Parse the YYYY-MM-DD string to Date, or use today's date as default
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) {
      return new Date();
    }

    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const currentDate = parseDate(value);

  // Format Date to YYYY-MM-DD string
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Display-friendly format: "Jan 1, 2002"
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return "Select date of birth";

    const date = parseDate(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const formatted = formatDateToString(selectedDate);
      onChangeText(formatted);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: palette.textPrimary }]}>{label}</Text>}

      <Pressable
        onPress={() => setShowPicker(true)}
        style={[
          styles.inputContainer,
          {
            borderColor: error ? palette.danger : palette.border,
            backgroundColor: palette.surface,
          },
        ]}
      >
        <Ionicons name="calendar" size={20} color={palette.textSecondary} style={styles.icon} />
        <Text
          style={[
            styles.text,
            {
              color: value ? palette.textPrimary : palette.textSecondary,
            },
          ]}
        >
          {formatDateForDisplay(value)}
        </Text>
      </Pressable>

      {error && <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>}

      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.pickerWrapper, { backgroundColor: palette.surface }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: palette.border }]}>
              <Pressable onPress={() => setShowPicker(false)}>
                <Text style={[styles.headerButton, { color: palette.primary }]}>Done</Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={currentDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={new Date()}
              textColor={palette.textPrimary}
            />
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  text: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  error: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerWrapper: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    overflow: "hidden",
  },
  pickerHeader: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  headerButton: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
});
