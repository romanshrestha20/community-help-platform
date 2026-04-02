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
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
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

                {showCloseButton && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close modal"
                    onPress={onClose}
                    style={[styles.closeButton, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}
                  >
                    <Text style={[styles.closeButtonText, { color: palette.textPrimary }]}>Close</Text>
                  </Pressable>
                )}
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

            {actions ? (
              <View style={[styles.actions, { borderTopColor: palette.border }]}>
                {actions}
              </View>
            ) : null}

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
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
  },
  closeButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  contentScroll: {
    maxHeight: 420,
  },
  content: {
    paddingBottom: theme.spacing.sm,
  },
  actions: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
});