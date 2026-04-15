import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { AppModal } from "@/components/ui/AppModal";
import { Stack, theme } from "@/design-system";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import type { CreateReviewPayload, Review, UpdateReviewPayload } from "../types/review.types";
import { StarRatingInput } from "./StarRatingInput";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateReviewPayload | UpdateReviewPayload) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  helpRequestId?: string;
  requestTitle?: string;
  helperName?: string;
  initialReview?: Review | null;
};

type FormState = {
  rating: number;
  title: string;
  comment: string;
};

const getInitialFormState = (initialReview?: Review | null): FormState => ({
  rating: initialReview?.rating ?? 0,
  title: initialReview?.title ?? "",
  comment: initialReview?.comment ?? "",
});

export const ReviewComposerModal = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  error = null,
  helpRequestId,
  requestTitle,
  helperName,
  initialReview,
}: Props) => {
  const { palette } = useThemeContext();
  const [form, setForm] = useState<FormState>(getInitialFormState(initialReview));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setForm(getInitialFormState(initialReview));
      setValidationError(null);
    }
  }, [initialReview, visible]);

  const isEditing = Boolean(initialReview);
  const commentLength = form.comment.trim().length;
  const titleText = isEditing ? "Update review" : "Leave a review";

  const helperLine = useMemo(() => {
    if (helperName && requestTitle) {
      return `Share how ${helperName} handled "${requestTitle}".`;
    }

    if (helperName) {
      return `Share how ${helperName} handled the request.`;
    }

    return "Rate the completed request and leave a short comment.";
  }, [helperName, requestTitle]);

  const handleFieldChange = (field: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const handleSubmit = async () => {
    if (!form.rating || form.rating < 1 || form.rating > 5) {
      setValidationError("Please choose a rating between 1 and 5.");
      return;
    }

    if (!form.comment.trim()) {
      setValidationError("Please write a short comment.");
      return;
    }

    if (!isEditing && !helpRequestId) {
      setValidationError("Missing help request reference.");
      return;
    }

    const basePayload = {
      rating: form.rating,
      title: form.title.trim() || undefined,
      comment: form.comment.trim(),
    };

    if (isEditing) {
      await onSubmit(basePayload as UpdateReviewPayload);
      return;
    }

    await onSubmit({
      helpRequestId: helpRequestId!,
      ...basePayload,
    } as CreateReviewPayload);
  };

  return (
    <AppModal
      visible={visible}
      title={titleText}
      onClose={onClose}
      showCloseButton
      scrollable
      actions={(
        <>
          <AppButton
            title="Cancel"
            variant="secondary"
            fullWidth={false}
            onPress={onClose}
            disabled={loading}
          />
          <AppButton
            title={loading ? (isEditing ? "Saving..." : "Submitting...") : (isEditing ? "Save" : "Submit")}
            fullWidth={false}
            onPress={() => {
              void handleSubmit();
            }}
            disabled={loading}
          />
        </>
      )}
    >
      <Stack gap="md">
        <View>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {helperLine}
          </Text>
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: palette.surfaceSecondary,
              borderColor: palette.border,
            },
          ]}
        >
          <StarRatingInput
            label="Rating *"
            value={form.rating}
            onChange={(value) => handleFieldChange("rating", value)}
            helperText="Choose 1 star for poor service up to 5 stars for excellent service."
            disabled={loading}
          />
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: palette.surfaceSecondary,
              borderColor: palette.border,
            },
          ]}
        >
          <AppInput
            label="Title"
            placeholder="Optional short headline"
            value={form.title}
            onChangeText={(value) => handleFieldChange("title", value)}
            editable={!loading}
            maxLength={120}
          />

          <AppInput
            label="Comment *"
            placeholder="Describe your experience"
            multiline
            numberOfLines={5}
            value={form.comment}
            onChangeText={(value) => handleFieldChange("comment", value)}
            editable={!loading}
            maxLength={1000}
            containerStyle={styles.commentInput}
          />

          <Text style={[styles.counter, { color: palette.textSecondary }]}>
            {commentLength}/1000
          </Text>
        </View>

        {validationError ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: palette.dangerSoft,
                borderColor: palette.danger,
              },
            ]}
          >
            <Text style={[styles.errorText, { color: palette.danger }]}>
              {validationError}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: palette.dangerSoft,
                borderColor: palette.danger,
              },
            ]}
          >
            <Text style={[styles.errorText, { color: palette.danger }]}>
              {error}
            </Text>
          </View>
        ) : null}
      </Stack>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  commentInput: {
    marginBottom: 0,
  },
  counter: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.xs,
    textAlign: "right",
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
