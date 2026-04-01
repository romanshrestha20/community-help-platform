import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
  dismissOnBackdrop?: boolean;
  showCloseButton?: boolean;
  animationType?: "none" | "slide" | "fade";
};

export const AppModal = ({
  visible,
  title,
  children,
  onClose,
  actions,
  dismissOnBackdrop = true,
  showCloseButton = true,
  animationType = "fade",
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <Modal visible={visible} transparent animationType={animationType} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissOnBackdrop ? onClose : undefined}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardWrap}
        >
          <View style={[styles.modal, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            {(title || showCloseButton) && (
              <View style={styles.header}>
                <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={1}>
                  {title || ""}
                </Text>

                
              </View>
            )}

            <ScrollView
              style={styles.contentScroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            {actions && <View style={styles.actions}>{actions}</View>}
          </View>
        </KeyboardAvoidingView>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  keyboardWrap: {
    width: "100%",
  },
  modal: {
    maxHeight: "84%",
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  closeButton: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.sm,
  },
  closeButtonText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  contentScroll: {
    maxHeight: 420,
  },
  content: {
    paddingVertical: theme.spacing.sm,
  },
  actions: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
});