import React from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "@/design-system";

type Props = {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
};

export const AppModal = ({ visible, title, children, onClose, actions }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          
          {title && <Text style={styles.title}>{title}</Text>}

          <View style={styles.content}>
            {children}
          </View>

          {actions && <View style={styles.actions}>{actions}</View>}

          <Pressable style={styles.closeArea} onPress={onClose} />
        </View>
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
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.sm,
  },
  content: {
    marginBottom: theme.spacing.md,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  closeArea: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});