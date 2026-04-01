import React from "react";
import { Text, StyleSheet } from "react-native";
import { AppModal } from "@/components/ui/AppModal";
import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/design-system";
import { HelpRequest } from "@/features/helpRequest/components";
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
    return (
        <AppModal
            visible={visible}
            title={selectedRequest ? `Bid on: ${selectedRequest.title}` : "Place Bid"}
            onClose={onClose}
            actions={<AppButton title="Close" variant="ghost" onPress={onClose} />}
        >
            {selectedRequest ? (
                <BidForm
                    helpRequestId={selectedRequest.id}
                    requestTitle={selectedRequest.title}
                    onSubmit={onSubmit}
                    loading={loading}
                    error={error}
                />
            ) : (
                <Text style={styles.emptyText}>Select a request to bid on.</Text>
            )}
        </AppModal>
    );
};

const styles = StyleSheet.create({
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.sm,
        paddingVertical: theme.spacing.sm,
    },
});