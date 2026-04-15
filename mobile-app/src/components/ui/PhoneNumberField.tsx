import React, { useEffect } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import {
  getCallingCodeForCountry,
  getPhonePlaceholder,
} from "@/utils/phone";
import CountryPicker, {
  DARK_THEME,
  type Country,
  type CountryCode,
} from "react-native-country-picker-modal";

type Props = {
  countryCode: string;
  callingCode?: string;
  nationalNumber: string;
  label?: string;
  error?: string | null;
  hint?: string | null;
  detectedLabel?: string | null;
  onCountryChange: (input: { countryCode: string; callingCode: string }) => void;
  onNationalNumberChange: (value: string) => void;
};

export const PhoneNumberField = ({
  countryCode,
  callingCode,
  nationalNumber,
  label = "Phone number",
  error,
  hint,
  detectedLabel,
  onCountryChange,
  onNationalNumberChange,
}: Props) => {
  const { palette } = useThemeContext();

  useEffect(() => {
    if (callingCode) {
      return;
    }

    let isCancelled = false;

    const syncCallingCode = async () => {
      const resolvedCallingCode = await getCallingCodeForCountry(countryCode);

      if (!resolvedCallingCode || isCancelled) {
        return;
      }

      onCountryChange({
        countryCode,
        callingCode: `+${resolvedCallingCode}`,
      });
    };

    void syncCallingCode();

    return () => {
      isCancelled = true;
    };
  }, [callingCode, countryCode, onCountryChange]);

  const handleSelect = (country: Country) => {
    onCountryChange({
      countryCode: country.cca2,
      callingCode: `+${country.callingCode[0] ?? ""}`,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: palette.textPrimary }]}>{label}</Text>

      <View
        style={[
          styles.fieldRow,
          {
            borderColor: error ? palette.danger : palette.border,
            backgroundColor: palette.surface,
          },
        ]}
      >
        <View style={[styles.countryTrigger, { borderRightColor: palette.border }]}>
          <CountryPicker
            countryCode={countryCode as CountryCode}
            withFilter
            withEmoji
            withCallingCode
            withCallingCodeButton
            withFlag
            onSelect={handleSelect}
            containerButtonStyle={styles.countryButton}
            theme={{
              ...DARK_THEME,
              backgroundColor: palette.surface,
              onBackgroundTextColor: palette.textPrimary,
              primaryColor: palette.primary,
              primaryColorVariant: palette.surfaceMuted,
            }}
          />
        </View>

        <TextInput
          value={nationalNumber}
          onChangeText={onNationalNumberChange}
          placeholder={getPhonePlaceholder(countryCode)}
          placeholderTextColor={palette.textSecondary}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          style={[styles.input, { color: palette.textPrimary }]}
        />
      </View>

      {error ? (
        <Text style={[styles.feedback, { color: palette.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.feedback, { color: palette.textSecondary }]}>{hint}</Text>
      ) : null}

      {detectedLabel ? (
        <Text style={[styles.detectedLabel, { color: palette.primary }]}>{detectedLabel}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xxs,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: 0.2,
  },
  fieldRow: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    overflow: "hidden",
  },
  countryTrigger: {
    minWidth: 118,
    borderRightWidth: 1,
    justifyContent: "center",
  },
  countryButton: {
    minHeight: 50,
    paddingHorizontal: theme.spacing.sm,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  feedback: {
    marginTop: theme.spacing.xxs,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  detectedLabel: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
