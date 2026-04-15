export type FavoriteRequest = {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  category: string;
  budget?: number | null;
  status: "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
  isPaid: boolean;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  requesterName?: string | null;
  requesterAvatarUrl?: string | null;
  requesterLocation?: string | null;
  images: {
    id: string;
    url: string;
    type: string;
    requestId?: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  bidCount: number;
  createdAt: string;
  favoritedAt?: string | null;
};

export type FavoriteListMeta = {
  total: number;
  page: number;
  totalPages: number;
};

export type FavoriteListResponse = {
  success: boolean;
  data: FavoriteRequest[];
  meta: FavoriteListMeta;
  message?: string;
};

export type FavoriteIdsResponse = {
  success: boolean;
  data: string[];
  message?: string;
  meta?: {
    total: number;
  };
};

export type FavoriteStatusResponse = {
  success: boolean;
  data: {
    requestId: string;
    favorited: boolean;
  };
  message?: string;
};

export type AddFavoriteResponse = {
  success: boolean;
  data: FavoriteRequest;
  message?: string;
  meta?: {
    created: boolean;
  };
};

export type RemoveFavoriteResponse = {
  success: boolean;
  data: {
    removed: boolean;
  };
  message?: string;
};
