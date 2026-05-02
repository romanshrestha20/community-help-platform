import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { Row, Stack, theme } from "@/design-system";
import { AppCategory } from "@/features/category/types/category.types";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  label?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  categories: AppCategory[];
  selectedCategoryId: string;
  budget: string;
  categoryError?: string | null;
  budgetError?: string | null;
  budgetInputRef?: React.Ref<any>;
  onCategoryChange: (categoryId: string) => void;
  onBudgetChange: (value: string) => void;
};

export const RequestCategoryBudgetPicker = ({
  label = "Category and budget",
  helperText = "Pick the closest category and add a budget if relevant.",
  required = true,
  disabled = false,
  accessibilityLabel,
  categories,
  selectedCategoryId,
  budget,
  categoryError,
  budgetError,
  budgetInputRef,
  onCategoryChange,
  onBudgetChange,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: palette.border,
          backgroundColor: palette.surfaceSecondary,
        },
      ]}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
        {label}
        {required ? <Text style={{ color: palette.danger }}> *</Text> : null}
      </Text>
      <Text style={[styles.sectionDescription, { color: palette.textSecondary }]}>{helperText}</Text>

      <Stack gap="xs">
        <Text style={[styles.label, { color: palette.textPrimary }]}>Category{required ? " *" : ""}</Text>
        <Row gap="sm" style={styles.wrapRow}>
          {categories.map((category) => (
            <AppButton
              key={category.id}
              title={category.name}
              onPress={() => onCategoryChange(category.id)}
              variant={selectedCategoryId === category.id ? "primary" : "secondary"}
              fullWidth={false}
              disabled={disabled}
            />
          ))}
        </Row>
        {categoryError ? <Text style={[styles.error, { color: palette.danger }]}>{categoryError}</Text> : null}
      </Stack>

      <AppInput
        ref={budgetInputRef}
        label="Budget"
        helperText="Optional. Leave empty for unpaid/community help."
        value={budget}
        error={budgetError ?? null}
        onChangeText={onBudgetChange}
        editable={!disabled}
        keyboardType="decimal-pad"
        placeholder="Optional"
        accessibilityLabel="Request budget"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  wrapRow: {
    flexWrap: "wrap",
  },
  error: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
