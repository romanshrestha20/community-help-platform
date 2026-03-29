// components/ui/AppDropdown.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { AppModal } from "./AppModal";
import { useModal } from "@/hooks/useModal";
import { theme } from "@/design-system";

type Option = {
  label: string;
  value: string;
};

type Props = {
  label?: string;
  value?: string;
  options: Option[];
  onSelect: (value: string) => void;
  placeholder?: string;
};

export const AppDropdown = ({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select",
}: Props) => {
  const { visible, open, close } = useModal();

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable style={styles.trigger} onPress={open}>
        <Text style={styles.triggerText}>{selectedLabel}</Text>
      </Pressable>

      <AppModal visible={visible} title={label || "Select"} onClose={close}>
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const active = item.value === value;

            return (
              <Pressable
                style={[styles.option, active && styles.optionActive]}
                onPress={() => {
                  onSelect(item.value);
                  close();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    active && styles.optionTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </AppModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },

  label: {
    marginBottom: 6,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },

  trigger: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },

  triggerText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
  },

  option: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  optionActive: {
    backgroundColor: theme.colors.primary,
  },

  optionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
  },

  optionTextActive: {
    color: theme.colors.textInverse,
  },
});