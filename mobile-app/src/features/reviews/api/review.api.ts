import apiClient from "@/api/api-client";
import type {
  CreateReviewPayload,
  ReviewsQuery,
  UpdateReviewPayload,
} from "../types/review.types";

export const createReviewApi = (payload: CreateReviewPayload) =>
  apiClient.post("/reviews", payload);

export const getReviewByIdApi = (reviewId: string) =>
  apiClient.get(`/reviews/${reviewId}`);

export const updateReviewApi = (reviewId: string, payload: UpdateReviewPayload) =>
  apiClient.patch(`/reviews/${reviewId}`, payload);

export const deleteReviewApi = (reviewId: string) =>
  apiClient.delete(`/reviews/${reviewId}`);

export const getUserReviewsApi = (userId: string, query?: ReviewsQuery) =>
  apiClient.get(`/users/${userId}/reviews`, { params: query });
