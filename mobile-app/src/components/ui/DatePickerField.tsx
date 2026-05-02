import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { FormFieldShell } from "@/components/ui/FormFieldShell";

type Props = {
  label?: string;
  required?: boolean;
  helperText?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  error?: string | null;
  value: string; // YYYY-MM-DD
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export const DatePickerField = ({
  label,
  required = false,
  helperText,
  disabled = false,
  accessibilityLabel,
  error,
  value,
  onChangeText,
  placeholder = "Select date",
}: Props) => {
  const { palette } = useThemeContext();
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

  const [showPicker, setShowPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();

    const [year, month, day] = dateStr.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);

    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return placeholder;

    const date = parseDate(dateStr);

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const currentDate = useMemo(() => parseDate(value), [value]);
  const maxDateString = useMemo(() => formatDateToString(new Date()), []);
  const WebDateInput = "input" as unknown as React.ElementType;

  const openIOSPicker = () => {
    if (disabled) return;
    setTempDate(currentDate);
    setIsFocused(true);
    setShowPicker(true);
  };

  const handleNativeChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (!selectedDate) return;

    if (isIOS) {
      setTempDate(selectedDate);
      return;
    }

    onChangeText(formatDateToString(selectedDate));
  };

  const handleDone = () => {
    onChangeText(formatDateToString(tempDate));
    setShowPicker(false);
    setIsFocused(false);
  };

  const handleCancel = () => {
    setTempDate(currentDate);
    setShowPicker(false);
    setIsFocused(false);
  };

  const borderColor = error
    ? palette.danger
    : isFocused
      ? palette.primary
      : palette.border;
  const displayColor = value ? palette.textPrimary : palette.textSecondary;

  return (
    <FormFieldShell
      label={label}
      required={required}
      helperText={helperText}
      error={error ?? undefined}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label ?? "Date field"}
    >

      {isWeb ? (
        <View
          style={[
            styles.inputContainer,
            {
              borderColor,
              backgroundColor: palette.surface,
              shadowColor: palette.textPrimary,
            },
            isFocused && styles.inputContainerFocused,
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={palette.textSecondary}
            style={styles.icon}
          />

          <Text style={[styles.text, { color: displayColor }]}>
            {formatDateForDisplay(value)}
          </Text>

          <WebDateInput
            value={value || ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onChangeText(event.target.value);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            type="date"
            max={maxDateString}
            aria-label={label ?? "Select date"}
            style={styles.webNativeInput as unknown as React.CSSProperties}
          />
        </View>
      ) : (
        <>
          <Pressable
            onPress={openIOSPicker}
            disabled={disabled}
            style={[
              styles.inputContainer,
              {
                borderColor,
                backgroundColor: palette.surface,
                shadowColor: palette.textPrimary,
              },
              isFocused && styles.inputContainerFocused,
            ]}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label ?? "Select date"}
            accessibilityState={{ disabled }}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={palette.textSecondary}
              style={styles.icon}
            />

            <Text style={[styles.text, { color: displayColor }]}>
              {formatDateForDisplay(value)}
            </Text>

            <Ionicons
              name="chevron-down"
              size={18}
              color={palette.textSecondary}
            />
          </Pressable>

          <Modal
            visible={showPicker}
            transparent
            animationType="slide"
            onRequestClose={handleCancel}
          >
            <Pressable
              style={styles.backdrop}
              onPress={handleCancel}
            />

            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: palette.surface,
                  borderTopColor: palette.border,
                },
              ]}
            >
              <View
                style={[
                  styles.sheetHeader,
                  {
                    borderBottomColor: palette.border,
                  },
                ]}
              >
                <Pressable onPress={handleCancel} hitSlop={8}>
                  <Text style={[styles.headerAction, { color: palette.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>
                  Select date
                </Text>

                <Pressable onPress={handleDone} hitSlop={8}>
                  <Text style={[styles.headerAction, { color: palette.primary }]}>
                    Done
                  </Text>
                </Pressable>
              </View>

              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={handleNativeChange}
                  textColor={palette.textPrimary}
                />
              </View>
            </View>
          </Modal>
        </>
      )}
    </FormFieldShell>
  );
};

const styles = StyleSheet.create({
  container: {},
  inputContainer: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
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
  icon: {
    marginRight: theme.spacing.xs,
  },
  text: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  webNativeInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    cursor: "pointer" as any,
    outlineStyle: "none" as any,
    borderWidth: 0,
    backgroundColor: "transparent",
    width: "100%" as any,
    height: "100%" as any,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    borderTopWidth: 1,
  },
  sheetHeader: {
    minHeight: 56,
    borderBottomWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerAction: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    minWidth: 64,
  },
  sheetTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  pickerContainer: {
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
