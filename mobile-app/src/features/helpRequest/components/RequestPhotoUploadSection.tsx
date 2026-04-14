import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppButton } from "@/components/ui/AppButton";
import { ImagePreviewModal, PreviewImageItem } from "@/components/ui/ImagePreviewModal";
import { Card, Stack, colors, spacing, typography, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { HelpRequest, RequestImageUploadInput } from "../types/helpRequest.types";

type PhotoGridProps = {
    images: PreviewImageItem[];
    emptyLabel: string;
    onPressImage?: (index: number) => void;
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

const PhotoGrid = ({ images, emptyLabel, onPressImage, onRemove }: PhotoGridProps) => {
    if (!images.length) {
        return <Text style={styles.emptyPhotosText}>{emptyLabel}</Text>;
    }

    return (
        <View style={styles.photoGrid}>
            {images.map((image, index) => (
                <Pressable
                    key={`${image.uri}-${index}`}
                    style={styles.photoTile}
                    onPress={() => onPressImage?.(index)}
                    disabled={!onPressImage}
                    accessibilityRole={onPressImage ? "button" : undefined}
                    accessibilityLabel={onPressImage ? "Preview uploaded photo" : undefined}
                >
                    <Image source={{ uri: image.uri }} style={styles.photoImage} />
                    {image.label ? (
                        <View style={styles.photoLabelPill}>
                            <Text style={styles.photoLabelText}>{image.label}</Text>
                        </View>
                    ) : null}
                    {onRemove ? (
                        <Pressable
                            onPress={(event) => {
                                event.stopPropagation();
                                onRemove(index);
                            }}
                            style={styles.photoRemoveButton}
                            accessibilityRole="button"
                            accessibilityLabel="Remove selected image"
                        >
                            <Ionicons name="close" size={14} color={colors.textPrimary} />
                        </Pressable>
                    ) : null}
                </Pressable>
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
    const [previewState, setPreviewState] = useState<{
        visible: boolean;
        images: PreviewImageItem[];
        index: number;
    }>({
        visible: false,
        images: [],
        index: 0,
    });

    const savedImages = useMemo(
        () =>
            existingImages
                .map((image: any) => ({ uri: image?.url ?? image?.uri, label: "Saved" }))
                .filter((image) => Boolean(image.uri)),
        [existingImages]
    );

    const pendingImages = useMemo(
        () => selectedImages.map((image) => ({ uri: image.uri, label: "Selected" })),
        [selectedImages]
    );

    const openPreview = (images: PreviewImageItem[], index: number) => {
        setPreviewState({
            visible: true,
            images,
            index,
        });
    };

    return (
        <>
            <Card style={[styles.sectionCard, { borderColor: palette.border }]}>
                <Stack gap="sm">
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleWrap}>
                            <View style={[styles.titlePill, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                                <Text style={[styles.titlePillText, { color: palette.textSecondary }]}>Request media</Text>
                            </View>
                            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>{title}</Text>
                            <Text style={[styles.sectionDescription, { color: palette.textSecondary }]}>{description}</Text>
                        </View>
                    </View>

                    {savedImages.length ? (
                        <View style={[styles.sectionGroup, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                            <View style={styles.groupHeader}>
                                <Text style={[styles.groupTitle, { color: palette.textPrimary }]}>Current photos</Text>
                                <Text style={[styles.groupMeta, { color: palette.textSecondary }]}>{savedImages.length}</Text>
                            </View>
                            <PhotoGrid
                                images={savedImages}
                                emptyLabel=""
                                onPressImage={(index) => openPreview(savedImages, index)}
                            />
                        </View>
                    ) : null}

                    {readOnly ? null : (
                        <View style={[styles.sectionGroup, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                            <View style={styles.groupHeader}>
                                <Text style={[styles.groupTitle, { color: palette.textPrimary }]}>Add more photos</Text>
                                <Text style={[styles.groupMeta, { color: palette.textSecondary }]}>{selectedImages.length}/{imageLimit}</Text>
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
                                images={pendingImages}
                                emptyLabel="Add photos from your gallery to build a stronger request."
                                onPressImage={(index) => openPreview(pendingImages, index)}
                                onRemove={onRemoveImage}
                            />
                        </View>
                    )}
                </Stack>
            </Card>

            <ImagePreviewModal
                visible={previewState.visible}
                images={previewState.images}
                initialIndex={previewState.index}
                title={title}
                onClose={() =>
                    setPreviewState((current) => ({
                        ...current,
                        visible: false,
                    }))
                }
            />
        </>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        padding: spacing.md,
        borderRadius: 16,
    },
    sectionHeader: {
        gap: 2,
    },
    sectionTitleWrap: {
        gap: 2,
    },
    titlePill: {
        alignSelf: "flex-start",
        borderWidth: 1,
        borderRadius: theme.radius.fill,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: spacing.xs,
    },
    titlePillText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    sectionTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
    },
    sectionDescription: {
        fontSize: typography.fontSize.xs,
        lineHeight: 18,
    },
    sectionGroup: {
        borderWidth: 1,
        borderRadius: 12,
        padding: spacing.sm,
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
    },
    groupMeta: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
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
