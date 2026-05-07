import React from "react";
import { Text, View, StyleSheet } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenFullForm: () => void;
};

export const CreateRequestDrawer = ({ visible, onClose, onOpenFullForm }: Props) => {
  const { palette } = useThemeContext();

  return (
    <AppModal visible={visible} title="Create request" onClose={onClose}>
      <View style={[styles.box, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}> 
        <Text style={[styles.text, { color: palette.textSecondary }]}>Open the full request form with title, category, description, budget, urgency, schedule, location, and photos.</Text>
      </View>
      <AppButton title="Open request form" onPress={onOpenFullForm} />
    </AppModal>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
});
