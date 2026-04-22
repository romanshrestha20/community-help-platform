import React from "react";
import { Text, StyleSheet } from "react-native";
import { AppModal } from "@/components/ui/AppModal";
import { theme } from "@/design-system";
import { HelpRequest } from "@/features/helpRequest/components";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { BidForm } from "./BidForm";

interface BidRequestModalProps {
    visible: boolean;
    selectedRequest: HelpRequest | null;
    onClose: () => void;
    onSubmit: (data: { amount?: number; message?: string }) => Promise<void>;
    loading: boolean;
    error?: string | null;
}

export const BidRequestModal: React.FC<BidRequestModalProps> = ({
    visible,
    selectedRequest,
    onClose,
    onSubmit,
    loading,
    error,
}) => {
    const { palette } = useThemeContext();

    return (
        <AppModal
            visible={visible}
            title={selectedRequest ? `Offer for ${selectedRequest.title}` : "Send Offer"}
            onClose={onClose}
        >
            {selectedRequest ? (
                <BidForm
                    helpRequestId={selectedRequest.id}
                    requestTitle={selectedRequest.title}
                    onSubmit={onSubmit}
                    onCancel={onClose}
                    loading={loading}
                    error={error}
                />
            ) : (
                <Text style={[styles.emptyText, { color: palette.textSecondary }]}>Select a request to bid on.</Text>
            )}
        </AppModal>
    );
};

const styles = StyleSheet.create({
    emptyText: {
        fontSize: theme.typography.fontSize.sm,
        paddingVertical: theme.spacing.sm,
    },
});
