import * as reviewApi from "../api/review.api";
import type {
  ApiEnvelope,
  CreateReviewPayload,
  Review,
  ReviewHelperPreview,
  ReviewHelpRequestStatus,
  ReviewSummary,
  ReviewsByUserResult,
  ReviewsPagination,
  UpdateReviewPayload,
} from "../types/review.types";

type UnknownRecord = Record<string, unknown>;

const handleResponse = <T>(response: ApiEnvelope<T>): T => {
  const { success, data, message } = response;

  if (!success) {
    throw new Error(message || "Request failed");
  }

  return data;
};

const toStringOrNull = (value: unknown): string | null => {
  return typeof value === "string" ? value : null;
};

const toNumber = (value: unknown, fallback = 0): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const normalizeUserPreview = (value: unknown) => {
  const record = (value ?? {}) as UnknownRecord;

  return {
    id: toStringOrNull(record.id) ?? "",
    email: toStringOrNull(record.email),
    fullName: toStringOrNull(record.fullName),
    avatarUrl: toStringOrNull(record.avatarUrl),
  };
};

const normalizeHelperPreview = (value: unknown): ReviewHelperPreview => {
  const base = normalizeUserPreview(value);
  const record = (value ?? {}) as UnknownRecord;
  const helpCount = toNumber(record.helpCount);
  const completedHelps = toNumber(record.completedHelps, helpCount);

  return {
    ...base,
    rating: toNumber(record.rating),
    helpCount,
    totalReviews: toNumber(record.totalReviews),
    completedHelps,
  };
};

const normalizeSummary = (value: unknown): ReviewSummary => {
  const record = (value ?? {}) as UnknownRecord;

  return {
    rating: toNumber(record.rating),
    totalReviews: toNumber(record.totalReviews),
    completedHelps: toNumber(record.completedHelps),
  };
};

const normalizePagination = (value: unknown): ReviewsPagination => {
  const record = (value ?? {}) as UnknownRecord;

  return {
    page: toNumber(record.page, 1),
    limit: toNumber(record.limit, 10),
    total: toNumber(record.total, 0),
    totalPages: toNumber(record.totalPages, 1),
  };
};

const normalizeReview = (value: unknown): Review => {
  const record = (value ?? {}) as UnknownRecord;
  const helpRequest = (record.helpRequest ?? {}) as UnknownRecord;

  return {
    id: toStringOrNull(record.id) ?? "",
    rating: toNumber(record.rating),
    title: toStringOrNull(record.title),
    comment: toStringOrNull(record.comment) ?? "",
    createdAt:
      toStringOrNull(record.createdAt) ?? new Date(0).toISOString(),
    reviewer: normalizeUserPreview(record.reviewer),
    helper: normalizeHelperPreview(record.helper),
    helpRequest: {
      id: toStringOrNull(helpRequest.id) ?? "",
      title: toStringOrNull(helpRequest.title) ?? "",
      status: (toStringOrNull(helpRequest.status) ??
        "COMPLETED") as ReviewHelpRequestStatus,
    },
  };
};

export const createReview = async (
  payload: CreateReviewPayload
): Promise<Review> => {
  const response = await reviewApi.createReviewApi(payload);
  return normalizeReview(handleResponse<Review>(response.data));
};

export const getReviewById = async (reviewId: string): Promise<Review> => {
  const response = await reviewApi.getReviewByIdApi(reviewId);
  return normalizeReview(handleResponse<Review>(response.data));
};

export const updateReview = async (
  reviewId: string,
  payload: UpdateReviewPayload
): Promise<Review> => {
  const response = await reviewApi.updateReviewApi(reviewId, payload);
  return normalizeReview(handleResponse<Review>(response.data));
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  const response = await reviewApi.deleteReviewApi(reviewId);
  handleResponse(response.data);
};

export const getUserReviews = async (
  userId: string,
  query?: { page?: number; limit?: number }
): Promise<ReviewsByUserResult> => {
  const response = await reviewApi.getUserReviewsApi(userId, query);
  const payload = handleResponse<{
    summary?: ReviewSummary;
    reviews?: Review[];
  }>(response.data);
  const meta = (response.data.meta ?? {}) as UnknownRecord;

  return {
    summary: normalizeSummary(payload.summary),
    reviews: Array.isArray(payload.reviews)
      ? payload.reviews.map((review) => normalizeReview(review))
      : [],
    pagination: normalizePagination(meta.pagination),
  };
};
