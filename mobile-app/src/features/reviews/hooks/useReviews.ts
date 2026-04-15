import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAsync } from "@/utils/useAsync";
import * as reviewService from "../services/review.service";
import type {
  CreateReviewPayload,
  Review,
  ReviewsByUserResult,
  ReviewSummary,
  UpdateReviewPayload,
} from "../types/review.types";

const EMPTY_SUMMARY: ReviewSummary = {
  rating: 0,
  totalReviews: 0,
  completedHelps: 0,
};

export const useReviews = () => {
  const { loading, error, run } = useAsync();
  const [reviewsByUserId, setReviewsByUserId] = useState<Record<string, Review[]>>({});
  const [summaryByUserId, setSummaryByUserId] = useState<Record<string, ReviewSummary>>({});
  const [paginationByUserId, setPaginationByUserId] = useState<
    Record<string, ReviewsByUserResult["pagination"]>
  >({});
  const [reviewById, setReviewById] = useState<Record<string, Review>>({});
  const [loadingByUserId, setLoadingByUserId] = useState<Record<string, boolean>>({});
  const [actionLoadingByReviewId, setActionLoadingByReviewId] = useState<
    Record<string, boolean>
  >({});

  const reviewsByUserIdRef = useRef(reviewsByUserId);
  const summaryByUserIdRef = useRef(summaryByUserId);
  const paginationByUserIdRef = useRef(paginationByUserId);

  useEffect(() => {
    reviewsByUserIdRef.current = reviewsByUserId;
  }, [reviewsByUserId]);

  useEffect(() => {
    summaryByUserIdRef.current = summaryByUserId;
  }, [summaryByUserId]);

  useEffect(() => {
    paginationByUserIdRef.current = paginationByUserId;
  }, [paginationByUserId]);

  const getCachedReviews = useCallback((userId: string) => {
    return reviewsByUserId[userId] || [];
  }, [reviewsByUserId]);

  const getCachedSummary = useCallback((userId: string) => {
    return summaryByUserId[userId] || EMPTY_SUMMARY;
  }, [summaryByUserId]);

  const getUserReviews = useCallback(async (
    userId: string,
    options?: { page?: number; limit?: number; forceRefresh?: boolean }
  ) => {
    const forceRefresh = options?.forceRefresh ?? false;
    const cached = reviewsByUserIdRef.current[userId];

    if (!forceRefresh && cached) {
      return {
        reviews: cached,
        summary: summaryByUserIdRef.current[userId] || EMPTY_SUMMARY,
        pagination: paginationByUserIdRef.current[userId],
      };
    }

    setLoadingByUserId((prev) => ({ ...prev, [userId]: true }));

    try {
      const result = await run(
        () =>
          reviewService.getUserReviews(userId, {
            page: options?.page,
            limit: options?.limit,
          }),
        { showErrorToast: true, errorMessage: "Failed to load reviews" }
      );

      if (result) {
        setReviewsByUserId((prev) => ({ ...prev, [userId]: result.reviews }));
        setSummaryByUserId((prev) => ({ ...prev, [userId]: result.summary }));
        setPaginationByUserId((prev) => ({ ...prev, [userId]: result.pagination }));
        setReviewById((prev) => {
          const next = { ...prev };
          for (const review of result.reviews) {
            next[review.id] = review;
          }
          return next;
        });
      }

      return result;
    } finally {
      setLoadingByUserId((prev) => ({ ...prev, [userId]: false }));
    }
  }, [run]);

  const getReviewById = useCallback(async (reviewId: string) => {
    const cached = reviewById[reviewId];
    if (cached) {
      return cached;
    }

    const review = await run(
      () => reviewService.getReviewById(reviewId),
      { showErrorToast: true, errorMessage: "Failed to load review" }
    );

    if (review) {
      setReviewById((prev) => ({ ...prev, [review.id]: review }));
    }

    return review;
  }, [reviewById, run]);

  const createReview = useCallback(async (payload: CreateReviewPayload) => {
    const review = await run(
      () => reviewService.createReview(payload),
      {
        showErrorToast: true,
        successMessage: "Review submitted",
        errorMessage: "Failed to submit review",
      }
    );

    if (review) {
      setReviewById((prev) => ({ ...prev, [review.id]: review }));
      setReviewsByUserId((prev) => ({
        ...prev,
        [review.helper.id]: [review, ...(prev[review.helper.id] || [])],
      }));
      setSummaryByUserId((prev) => {
        const current = prev[review.helper.id] || EMPTY_SUMMARY;
        return {
          ...prev,
          [review.helper.id]: {
            rating: review.helper.rating,
            totalReviews: review.helper.totalReviews,
            completedHelps:
              current.completedHelps || review.helper.completedHelps || review.helper.helpCount,
          },
        };
      });
    }

    return review;
  }, [run]);

  const updateReview = useCallback(async (
    reviewId: string,
    payload: UpdateReviewPayload
  ) => {
    setActionLoadingByReviewId((prev) => ({ ...prev, [reviewId]: true }));

    try {
      const review = await run(
        () => reviewService.updateReview(reviewId, payload),
        {
          showErrorToast: true,
          successMessage: "Review updated",
          errorMessage: "Failed to update review",
        }
      );

      if (review) {
        setReviewById((prev) => ({ ...prev, [review.id]: review }));
        setReviewsByUserId((prev) => ({
          ...prev,
          [review.helper.id]: (prev[review.helper.id] || []).map((item) =>
            item.id === review.id ? review : item
          ),
        }));
        setSummaryByUserId((prev) => ({
          ...prev,
          [review.helper.id]: {
            rating: review.helper.rating,
            totalReviews: review.helper.totalReviews,
            completedHelps:
              prev[review.helper.id]?.completedHelps ||
              review.helper.completedHelps ||
              review.helper.helpCount,
          },
        }));
      }

      return review;
    } finally {
      setActionLoadingByReviewId((prev) => ({ ...prev, [reviewId]: false }));
    }
  }, [run]);

  const deleteReview = useCallback(async (reviewId: string) => {
    const existing = reviewById[reviewId];
    setActionLoadingByReviewId((prev) => ({ ...prev, [reviewId]: true }));

    try {
      const result = await run(
        () => reviewService.deleteReview(reviewId),
        {
          showErrorToast: true,
          successMessage: "Review deleted",
          errorMessage: "Failed to delete review",
        }
      );

      if (result !== null && existing) {
        setReviewById((prev) => {
          const next = { ...prev };
          delete next[reviewId];
          return next;
        });
        setReviewsByUserId((prev) => ({
          ...prev,
          [existing.helper.id]: (prev[existing.helper.id] || []).filter(
            (review) => review.id !== reviewId
          ),
        }));
      }

      return result !== null;
    } finally {
      setActionLoadingByReviewId((prev) => ({ ...prev, [reviewId]: false }));
    }
  }, [reviewById, run]);

  const isAnyReviewActionLoading = useMemo(() => {
    return Object.values(actionLoadingByReviewId).some(Boolean);
  }, [actionLoadingByReviewId]);

  return {
    loading,
    error,
    reviewsByUserId,
    summaryByUserId,
    paginationByUserId,
    reviewById,
    loadingByUserId,
    actionLoadingByReviewId,
    isAnyReviewActionLoading,
    getCachedReviews,
    getCachedSummary,
    getUserReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
  };
};
