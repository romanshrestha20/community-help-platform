import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppButton } from "@/components/ui/AppButton";
import { Card, Stack, colors, spacing, typography, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { HelpRequest, RequestImageUploadInput } from "../types/helpRequest.types";

type PhotoGridProps = {
    images: { uri: string; label?: string }[];
    emptyLabel: string;
    onRemove?: (index: number) => void;
};

export type RequestPhotoUploadSectionProps = {
    title?: string;
    description?: string;
    loading?: boolean;
    existingImages?: HelpRequest["images"];
    selectedImages?: RequestImageUploadInput[];
    imageLimit?: number;
    readOnly?: boolean;
    onPickImages?: () => void;
    onRemoveImage?: (index: number) => void;
};

const PhotoGrid = ({ images, emptyLabel, onRemove }: PhotoGridProps) => {
    if (!images.length) {
        return <Text style={styles.emptyPhotosText}>{emptyLabel}</Text>;
    }

    return (
        <View style={styles.photoGrid}>
            {images.map((image, index) => (
                <View key={`${image.uri}-${index}`} style={styles.photoTile}>
                    <Image source={{ uri: image.uri }} style={styles.photoImage} />
                    {image.label ? (
                        <View style={styles.photoLabelPill}>
                            <Text style={styles.photoLabelText}>{image.label}</Text>
                        </View>
                    ) : null}
                    {onRemove ? (
                        <Pressable
                            onPress={() => onRemove(index)}
                            style={styles.photoRemoveButton}
                            accessibilityRole="button"
                            accessibilityLabel="Remove selected image"
                        >
                            <Ionicons name="close" size={14} color={colors.textPrimary} />
                        </Pressable>
                    ) : null}
                </View>
            ))}
        </View>
    );
};

export const RequestPhotoUploadSection = ({
    title = "Photos",
    description = "Show the problem clearly. Up to 5 images help helpers understand the request faster.",
    loading = false,
    existingImages = [],
    selectedImages = [],
    imageLimit = 5,
    readOnly = false,
    onPickImages,
    onRemoveImage,
}: RequestPhotoUploadSectionProps) => {
    const { palette } = useThemeContext();

    return (
        <Card style={styles.sectionCard}>
            <Stack gap="sm">
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleWrap}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                        <Text style={styles.sectionDescription}>{description}</Text>
                    </View>
                </View>

                {existingImages.length ? (
                    <View style={styles.sectionGroup}>
                        <View style={styles.groupHeader}>
                            <Text style={styles.groupTitle}>Current photos</Text>
                            <Text style={styles.groupMeta}>{existingImages.length}</Text>
                        </View>
                        <PhotoGrid
                            images={existingImages
                                .map((image: any) => ({ uri: image?.url ?? image?.uri, label: "Saved" }))
                                .filter((image) => Boolean(image.uri))}
                            emptyLabel=""
                        />
                    </View>
                ) : null}

                {readOnly ? null : (
                    <View style={styles.sectionGroup}>
                        <View style={styles.groupHeader}>
                            <Text style={styles.groupTitle}>Add more photos</Text>
                            <Text style={styles.groupMeta}>{selectedImages.length}/{imageLimit}</Text>
                        </View>

                        <AppButton
                            title="Add Photos"
                            onPress={onPickImages ?? (() => { })}
                            variant="secondary"
                            fullWidth={false}
                            icon={<Ionicons name="images-outline" size={18} color={palette.textPrimary} />}
                            disabled={loading || selectedImages.length >= imageLimit || !onPickImages}
                        />

                        <PhotoGrid
                            images={selectedImages.map((image) => ({ uri: image.uri }))}
                            emptyLabel="Add photos from your gallery to build a stronger request."
                            onRemove={onRemoveImage}
                        />
                    </View>
                )}
            </Stack>
        </Card>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        padding: spacing.md,
        borderRadius: theme.radius.lg,
    },
    sectionHeader: {
        gap: 2,
    },
    sectionTitleWrap: {
        gap: 2,
    },
    sectionTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
    },
    sectionDescription: {
        fontSize: typography.fontSize.xs,
        lineHeight: 18,
        color: colors.textSecondary,
    },
    sectionGroup: {
        gap: spacing.sm,
    },
    groupHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    groupTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
    },
    groupMeta: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textSecondary,
    },
    emptyPhotosText: {
        fontSize: typography.fontSize.xs,
        lineHeight: 18,
        color: colors.textSecondary,
    },
    photoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    photoTile: {
        position: "relative",
    },
    photoImage: {
        width: 88,
        height: 88,
        borderRadius: theme.radius.md,
        backgroundColor: colors.surfaceMuted,
    },
    photoLabelPill: {
        position: "absolute",
        left: 8,
        bottom: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.radius.fill,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
    },
    photoLabelText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
        color: colors.textInverse,
    },
    photoRemoveButton: {
        position: "absolute",
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: theme.radius.fill,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
});