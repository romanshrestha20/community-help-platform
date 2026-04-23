import React from "react";
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { AppButton } from "./AppButton";

export type ActionSheetItem = {
    key: string;
    label: string;
    onPress: () => void | Promise<void>;
    icon?: React.ReactNode;
    variant?: "default" | "destructive";
    disabled?: boolean;
    loading?: boolean;
    closeOnPress?: boolean;
};

type Props = {
    visible: boolean;
    title?: string;
    description?: string;
    actions: ActionSheetItem[];
    onClose: () => void;
    cancelLabel?: string;
    dismissOnBackdrop?: boolean;
};

export const ActionSheet = ({
    visible,
    title,
    description,
    actions,
    onClose,
    cancelLabel = "Cancel",
    dismissOnBackdrop = true,
}: Props) => {
    const { palette } = useThemeContext();

    const handleBackdropPress = () => {
        if (dismissOnBackdrop) {
            onClose();
        }
    };

    const handleActionPress = async (action: ActionSheetItem) => {
        await Promise.resolve(action.onPress());

        if (action.closeOnPress !== false) {
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent={Platform.OS === "android"}
        >
            <View style={[styles.root, { backgroundColor: palette.overlay }]}>
                <Pressable style={StyleSheet.absoluteFillObject} onPress={handleBackdropPress} />

                <View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                        },
                    ]}
                >
                    <View style={[styles.grabber, { backgroundColor: palette.borderStrong }]} />

                    {title ? <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text> : null}
                    {description ? (
                        <Text style={[styles.description, { color: palette.textSecondary }]}>{description}</Text>
                    ) : null}

                    <View style={styles.actionsWrap}>
                        {actions.map((action) => (
                            <AppButton
                                key={action.key}
                                title={action.label}
                                onPress={() => {
                                    void handleActionPress(action);
                                }}
                                variant={action.variant === "destructive" ? "danger" : "secondary"}
                                disabled={action.disabled}
                                loading={action.loading}
                                icon={action.icon}
                            />
                        ))}
                    </View>

                    <AppButton title={cancelLabel} onPress={onClose} variant="ghost" />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: "flex-end",
    },
    sheet: {
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        borderWidth: 1,
        borderBottomWidth: 0,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.xl,
        gap: theme.spacing.sm,
    },
    grabber: {
        alignSelf: "center",
        width: 44,
        height: 4,
        borderRadius: theme.radius.fill,
        marginBottom: theme.spacing.xs,
    },
    title: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
    },
    description: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.sm,
    },
    actionsWrap: {
        gap: theme.spacing.xs,
    },
});
