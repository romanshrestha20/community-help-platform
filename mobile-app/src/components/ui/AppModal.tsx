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
          <View style={styles.modal}>
            {(title || showCloseButton) && (
              <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>
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
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
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
    color: theme.colors.textPrimary,
  },
  closeButton: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceMuted,
  },
  closeButtonText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
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