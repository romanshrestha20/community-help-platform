import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from "react-native";

import { ConfirmDialog } from "@/components/common/States";
import { AppHeader } from "@/components/ui/AppHeader";
import { AppButton } from "@/components/ui/AppButton";
import { AppDropdown } from "@/components/ui/AppDropDown";
import { AppInput } from "@/components/ui/AppInput";
import { AppModal } from "@/components/ui/AppModal";
import { Card, Screen, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { BidRequestDetail } from "@/features/bid/components/BidRequestDetail";
import { RequestCard } from "@/features/helpRequest/components/RequestCard";
import { useHelpRequest } from "@/features/helpRequest/hooks/helpRequest.hook";
import { HelpRequest, HelpRequestStatus, UpdateHelpRequestData } from "@/features/helpRequest/types/helpRequest.types";
import { showToast } from "@/utils/toast";

type SortBy = "NEWEST" | "OLDEST" | "MOST_BIDS";
type StatusFilter = "ALL" | HelpRequestStatus;
type CategoryFilter = "ALL" | HelpRequest["category"];

const PAGE_SIZE = 50;

export default function ProfileRequestsScreen() {
    const { palette } = useThemeContext();
    const user = useAuthStore((state) => state.user);
    const { getMyHelpRequests, updateHelpRequest, deleteHelpRequest } = useHelpRequest();

    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [sortBy, setSortBy] = useState<SortBy>("NEWEST");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
    const [editingRequest, setEditingRequest] = useState<HelpRequest | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<HelpRequest | null>(null);
    const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
    const [activeBidRequest, setActiveBidRequest] = useState<HelpRequest | null>(null);
    const [editForm, setEditForm] = useState<UpdateHelpRequestData>({
        title: "",
        description: "",
        category: "FOOD",
        budget: undefined,
        city: "",
        country: "",
    });

    const loadRequests = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const collected: HelpRequest[] = [];
            let page = 1;

            while (page <= 20) {
                const pageData =
                    (await getMyHelpRequests({
                        page,
                        limit: PAGE_SIZE,
                        sortBy: "createdAt",
                        order: "desc",
                    })) ?? [];

                const ownRequests = user?.id
                    ? pageData.filter((request) => request.requesterId === user.id)
                    : pageData;

                collected.push(...ownRequests);

                if (pageData.length < PAGE_SIZE) {
                    break;
                }

                page += 1;
            }

            setRequests(collected);
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, [getMyHelpRequests, user?.id]);

    useEffect(() => {
        loadRequests(false);
    }, [loadRequests]);

    const filteredRequests = useMemo(() => {
        let next = [...requests];

        if (statusFilter !== "ALL") {
            next = next.filter((request) => request.status === statusFilter);
        }

        if (categoryFilter !== "ALL") {
            next = next.filter((request) => request.category === categoryFilter);
        }

        if (sortBy === "NEWEST") {
            next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        if (sortBy === "OLDEST") {
            next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        if (sortBy === "MOST_BIDS") {
            next.sort((a, b) => b.bidCount - a.bidCount);
        }

        return next;
    }, [requests, sortBy, statusFilter, categoryFilter]);

    const resetFilters = () => {
        setSortBy("NEWEST");
        setStatusFilter("ALL");
        setCategoryFilter("ALL");
    };

    const openEditModal = (request: HelpRequest) => {
        setEditingRequest(request);
        setEditForm({
            title: request.title,
            description: request.description,
            category: request.category,
            budget: request.budget,
            city: request.city ?? "",
            country: request.country ?? "",
        });
    };

    const closeEditModal = () => {
        if (savingEdit) {
            return;
        }
        setEditingRequest(null);
    };

    const submitEdit = async () => {
        if (!editingRequest) {
            return;
        }

        if (!editForm.title?.trim() || !editForm.description?.trim()) {
            showToast("Title and description are required");
            return;
        }

        if (editForm.budget && editForm.budget <= 0) {
            showToast("Budget must be greater than 0");
            return;
        }

        setSavingEdit(true);

        try {
            const payload: UpdateHelpRequestData = {
                title: editForm.title.trim(),
                description: editForm.description.trim(),
                category: editForm.category,
                budget: editForm.budget,
                city: editForm.city?.trim() || undefined,
                country: editForm.country?.trim() || undefined,
            };

            const updated = await updateHelpRequest(editingRequest.id, payload);

            setRequests((prev) => prev.map((request) => (
                request.id === updated.id ? { ...request, ...updated } : request
            )));
            showToast("Request updated");
            setEditingRequest(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not update request";
            showToast(message);
        } finally {
            setSavingEdit(false);
        }
    };

    const openDeleteConfirm = (request: HelpRequest) => {
        setRequestToDelete(request);
    };

    const cancelDeleteConfirm = () => {
        if (deletingRequestId) {
            return;
        }
        setRequestToDelete(null);
    };

    const confirmDelete = async () => {
        if (!requestToDelete || deletingRequestId) {
            return;
        }

        setDeletingRequestId(requestToDelete.id);

        try {
            await deleteHelpRequest(requestToDelete.id);
            setRequests((prev) => prev.filter((item) => item.id !== requestToDelete.id));
            showToast("Request deleted");
            setRequestToDelete(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not delete request";
            showToast(message);
        } finally {
            setDeletingRequestId(null);
        }
    };

    const openBiddersModal = useCallback((request: HelpRequest) => {
        setActiveBidRequest(request);
    }, []);

    const closeBiddersModal = () => {
        setActiveBidRequest(null);
    };

    return (
        <Screen
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRequests(true)} />}
        >
            <AppHeader
                title="My Requests"
                subtitle="All requests you have posted since opening your account"
            />

            <Card style={styles.filtersCard}>
                <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Sort and Filter</Text>

                <AppDropdown
                    label="Sort"
                    value={sortBy}
                    onSelect={(value) => setSortBy(value as SortBy)}
                    options={[
                        { label: "Newest", value: "NEWEST" },
                        { label: "Oldest", value: "OLDEST" },
                        { label: "Most Bids", value: "MOST_BIDS" },
                    ]}
                />

                <AppDropdown
                    label="Status"
                    value={statusFilter}
                    onSelect={(value) => setStatusFilter(value as StatusFilter)}
                    options={[
                        { label: "All", value: "ALL" },
                        { label: "Open", value: "OPEN" },
                        { label: "Assigned", value: "ASSIGNED" },
                        { label: "Completed", value: "COMPLETED" },
                        { label: "Cancelled", value: "CANCELLED" },
                    ]}
                />

                <AppDropdown
                    label="Category"
                    value={categoryFilter}
                    onSelect={(value) => setCategoryFilter(value as CategoryFilter)}
                    options={[
                        { label: "All", value: "ALL" },
                        { label: "Food", value: "FOOD" },
                        { label: "Medical", value: "MEDICAL" },
                        { label: "Education", value: "EDUCATION" },
                        { label: "Other", value: "OTHER" },
                    ]}
                />

                <AppButton title="Reset Filters" onPress={resetFilters} />
            </Card>

            <Card style={styles.listCard}>
                <View style={styles.listHeader}>
                    <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Requests</Text>
                    <Text style={[styles.countText, { color: palette.textSecondary, borderColor: palette.border }]}>{filteredRequests.length}</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" style={styles.loader} />
                ) : requests.length === 0 ? (
                    <Text style={[styles.emptyText, { color: palette.textSecondary }]}>You haven&apos;t made any requests yet.</Text>
                ) : filteredRequests.length === 0 ? (
                    <Text style={[styles.emptyText, { color: palette.textSecondary }]}>No requests match the selected filters.</Text>
                ) : (
                    filteredRequests.map((request) => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            isOwner
                            onViewBids={() => openBiddersModal(request)}
                            onEdit={() => openEditModal(request)}
                            onDelete={() => openDeleteConfirm(request)}
                        />
                    ))
                )}
            </Card>

            <AppModal
                visible={Boolean(activeBidRequest)}
                title={activeBidRequest ? "View Bidders" : "Bidders"}
                onClose={closeBiddersModal}
                actions={<AppButton title="Done" onPress={closeBiddersModal} variant="ghost" fullWidth={false} />}
            >
                {activeBidRequest && (
                    <BidRequestDetail
                        requestId={activeBidRequest.id}
                        initialRequest={activeBidRequest}
                        forceRequesterActions
                        compact
                    />
                )}
            </AppModal>

            {requestToDelete && (
                <ConfirmDialog
                    title="Delete Request"
                    message="Are you sure you want to delete this request? This action cannot be undone."
                    cancelLabel="Cancel"
                    confirmLabel={deletingRequestId ? "Deleting..." : "Delete"}
                    onCancel={cancelDeleteConfirm}
                    onConfirm={confirmDelete}
                    isDangerous
                />
            )}

            <AppModal
                visible={Boolean(editingRequest)}
                title="Edit Request"
                onClose={closeEditModal}
                dismissOnBackdrop={!savingEdit}
            >
                <AppInput
                    label="Title"
                    value={editForm.title ?? ""}
                    onChangeText={(value) => setEditForm((prev) => ({ ...prev, title: value }))}
                    editable={!savingEdit}
                />
                <AppInput
                    label="Description"
                    value={editForm.description ?? ""}
                    onChangeText={(value) => setEditForm((prev) => ({ ...prev, description: value }))}
                    editable={!savingEdit}
                    multiline
                    numberOfLines={4}
                />
                <AppDropdown
                    label="Category"
                    value={editForm.category ?? "FOOD"}
                    onSelect={(value) =>
                        setEditForm((prev) => ({
                            ...prev,
                            category: value as UpdateHelpRequestData["category"],
                        }))
                    }
                    options={[
                        { label: "Food", value: "FOOD" },
                        { label: "Medical", value: "MEDICAL" },
                        { label: "Education", value: "EDUCATION" },
                        { label: "Other", value: "OTHER" },
                    ]}
                />
                <AppInput
                    label="Budget"
                    keyboardType="decimal-pad"
                    value={editForm.budget?.toString() ?? ""}
                    onChangeText={(value) =>
                        setEditForm((prev) => ({
                            ...prev,
                            budget: value ? Number(value) : undefined,
                        }))
                    }
                    editable={!savingEdit}
                />
                <AppInput
                    label="City"
                    value={editForm.city ?? ""}
                    onChangeText={(value) => setEditForm((prev) => ({ ...prev, city: value }))}
                    editable={!savingEdit}
                />
                <AppInput
                    label="Country"
                    value={editForm.country ?? ""}
                    onChangeText={(value) => setEditForm((prev) => ({ ...prev, country: value }))}
                    editable={!savingEdit}
                />

                <View style={styles.modalActions}>
                    <AppButton
                        title="Cancel"
                        onPress={closeEditModal}
                        variant="ghost"
                        fullWidth={false}
                        disabled={savingEdit}
                    />
                    <AppButton
                        title="Save Changes"
                        onPress={submitEdit}
                        loading={savingEdit}
                        fullWidth={false}
                    />
                </View>
            </AppModal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    filtersCard: {
        marginTop: theme.spacing.xs,
    },
    listCard: {
        marginTop: theme.spacing.xs,
        paddingBottom: theme.spacing.xs,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
        marginBottom: theme.spacing.sm,
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.sm,
    },
    countText: {
        fontSize: theme.typography.fontSize.xs,
        borderWidth: 1,
        borderRadius: theme.radius.fill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
    },
    loader: {
        marginVertical: theme.spacing.md,
    },
    emptyText: {
        fontSize: theme.typography.fontSize.sm,
        paddingVertical: theme.spacing.sm,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
});
