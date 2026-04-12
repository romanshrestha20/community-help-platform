import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

interface MessageComposerProps {
    onSend: (content: string) => Promise<unknown> | unknown;
    disabled?: boolean;
    sending?: boolean;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
    onSend,
    disabled = false,
    sending = false,
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

        try {
            await onSend(outboundText);
        } catch {
            setText(outboundText);
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                },
            ]}
        >
            <TextInput
                style={[
                    styles.input,
                    {
                        color: palette.textPrimary,
                    },
                ]}
                value={text}
                onChangeText={setText}
                placeholder={disabled ? "Messaging unavailable" : "Type a message"}
                placeholderTextColor={palette.textMuted}
                editable={!disabled && !sending}
                multiline
                maxLength={1000}
                textAlignVertical="center"
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
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "flex-end",
        borderWidth: 1,
        borderRadius: 20,
        paddingLeft: theme.spacing.sm,
        paddingRight: 6,
        paddingVertical: 4,
        minHeight: 48,
    },
    input: {
        ...theme.typography.textStyle.body,
        flex: 1,
        minHeight: 24,
        maxHeight: 96,
        paddingVertical: 6,
        paddingRight: theme.spacing.xs,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: theme.spacing.xs,
    },
});

export default MessageComposer;
