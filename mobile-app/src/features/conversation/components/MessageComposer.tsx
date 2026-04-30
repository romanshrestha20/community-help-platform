import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface MessageComposerProps {
    onSend: (content: string) => Promise<unknown> | unknown;
    onTyping?: () => void;
    onStopTyping?: () => void;
    disabled?: boolean;
    sending?: boolean;
    statusLabel?: string;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
    onSend,
    onTyping,
    onStopTyping,
    disabled = false,
    sending = false,
    statusLabel,
}) => {
    const { palette } = useThemeContext();
    const [text, setText] = useState("");

    const trimmedText = text.trim();
    const canSend = !disabled && !sending && trimmedText.length > 0;

    const handleSend = async () => {
        if (!canSend) {
            return;
        }

        const outboundText = trimmedText;
        setText("");
        onStopTyping?.();

        try {
            await onSend(outboundText);
        } catch {
            setText(outboundText);
        }
    };

    return (
        <View style={styles.shell}>
            {statusLabel ? (
                <Text style={[styles.statusLabel, { color: palette.textSecondary }]}>
                    {statusLabel}
                </Text>
            ) : null}

            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                    },
                ]}
            >
                <Pressable
                    style={[
                        styles.attachmentButton,
                        {
                            backgroundColor: palette.surfaceMuted,
                            borderColor: palette.border,
                        },
                    ]}
                    disabled
                >
                    <Ionicons name="add" size={16} color={palette.textMuted} />
                </Pressable>

                <TextInput
                    style={[styles.input, { color: palette.textPrimary }]}
                    value={text}
                    onChangeText={(value) => {
                        setText(value);

                        if (value.trim().length > 0) {
                            onTyping?.();
                        } else {
                            onStopTyping?.();
                        }
                    }}
                    placeholder={disabled ? "Conversation is read-only" : "Write a message..."}
                    placeholderTextColor={palette.textMuted}
                    editable={!disabled && !sending}
                    multiline
                    maxLength={1000}
                    textAlignVertical="center"
                    onBlur={onStopTyping}
                />

                <Pressable
                    onPress={() => {
                        void handleSend();
                    }}
                    disabled={!canSend}
                    style={({ pressed }) => [
                        styles.sendButton,
                        {
                            backgroundColor: canSend
                                ? pressed
                                    ? palette.primaryPressed
                                    : palette.primary
                                : palette.surfaceMuted,
                        },
                    ]}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color={palette.textInverse} />
                    ) : (
                        <Ionicons
                            name="arrow-up"
                            size={18}
                            color={canSend ? palette.textInverse : palette.textMuted}
                        />
                    )}
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    shell: {
        gap: theme.spacing.xs,
    },
    statusLabel: {
        ...theme.typography.textStyle.caption,
        paddingHorizontal: 2,
    },
    container: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 999,
        paddingLeft: theme.spacing.xs,
        paddingRight: 8,
        paddingVertical: 6,
        minHeight: 50,
    },
    attachmentButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 6,
    },
    input: {
        ...theme.typography.textStyle.body,
        flex: 1,
        minHeight: 22,
        maxHeight: 92,
        paddingVertical: 5,
        paddingRight: theme.spacing.xs,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: theme.spacing.xs,
    },
});

export default MessageComposer;
