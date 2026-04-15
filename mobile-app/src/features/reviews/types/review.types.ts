export type ReviewHelpRequestStatus =
  | "OPEN"
  | "ASSIGNED"
  | "COMPLETED"
  | "CANCELLED";

export interface ReviewUserPreview {
  id: string;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface ReviewHelperPreview extends ReviewUserPreview {
  rating: number;
  helpCount: number;
  totalReviews: number;
  completedHelps: number;
}

export interface ReviewHelpRequestPreview {
  id: string;
  title: string;
  status: ReviewHelpRequestStatus;
}

export interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  createdAt: string;
  reviewer: ReviewUserPreview;
  helper: ReviewHelperPreview;
  helpRequest: ReviewHelpRequestPreview;
}

export interface ReviewSummary {
  rating: number;
  totalReviews: number;
  completedHelps: number;
}

export interface ReviewsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReviewsByUserResult {
  summary: ReviewSummary;
  reviews: Review[];
  pagination: ReviewsPagination;
}

export interface CreateReviewPayload {
  helpRequestId: string;
  rating: number;
  title?: string;
  comment: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  title?: string;
  comment?: string;
}

export interface ReviewsQuery {
  page?: number;
  limit?: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}
