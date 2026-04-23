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
  scrollable?: boolean;
};

export const AppModal = ({
  visible,
  title,
  children,
  onClose,
  actions,
  dismissOnBackdrop = true,
  showCloseButton = false,
  animationType = "fade",
  scrollable = false,
}: Props) => {
  const { palette } = useThemeContext();

  const handleBackdropPress = () => {
    if (dismissOnBackdrop) {
      onClose();
    }
  };

  const showHeader = Boolean(title) || showCloseButton;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <View style={[styles.backdrop, { backgroundColor: palette.overlay }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleBackdropPress} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardWrap}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            {showHeader ? (
              <View style={styles.header}>
                <View style={styles.titleWrap}>
                  {title ? (
                    <Text
                      style={[styles.title, { color: palette.textPrimary }]}
                      numberOfLines={1}
                    >
                      {title}
                    </Text>
                  ) : null}
                </View>

                {showCloseButton ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close modal"
                    onPress={onClose}
                    style={[
                      styles.closeButton,
                      {
                        backgroundColor: palette.surfaceMuted,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.closeButtonText,
                        { color: palette.textPrimary },
                      ]}
                    >
                      Close
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {scrollable ? (
              <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.content}>{children}</View>
            )}

            {actions ? (
              <View
                style={[
                  styles.actions,
                  {
                    borderTopColor: palette.border,
                  },
                ]}
              >
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
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  keyboardWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  closeButton: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  contentScroll: {
    maxHeight: 420,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
});
