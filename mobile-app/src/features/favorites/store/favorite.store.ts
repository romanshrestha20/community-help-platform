import { create } from "zustand";

import { FavoriteListMeta } from "@/features/favorites/types/favorite.type";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";

type FavoriteState = {
  favoriteIds: string[];
  favoriteRequests: HelpRequest[];
  meta: FavoriteListMeta | null;
  idsLoaded: boolean;
  idsLoading: boolean;
  listLoading: boolean;
  actionLoadingById: Record<string, boolean>;
  error: string | null;
  setFavoriteIds: (favoriteIds: string[]) => void;
  addFavoriteId: (requestId: string) => void;
  removeFavoriteId: (requestId: string) => void;
  setFavoriteRequests: (requests: HelpRequest[], meta?: FavoriteListMeta | null) => void;
  upsertFavoriteRequest: (request: HelpRequest) => void;
  removeFavoriteRequest: (requestId: string) => void;
  setIdsLoading: (loading: boolean) => void;
  setListLoading: (loading: boolean) => void;
  setActionLoading: (requestId: string, loading: boolean) => void;
  setError: (error: string | null) => void;
  clearFavorites: () => void;
};

const sortByFavoritedAt = (requests: HelpRequest[]) => {
  return [...requests].sort((left, right) => {
    const leftTime = new Date(left.favoritedAt ?? left.createdAt).getTime();
    const rightTime = new Date(right.favoritedAt ?? right.createdAt).getTime();
    return rightTime - leftTime;
  });
};

export const useFavoriteStore = create<FavoriteState>((set) => ({
  favoriteIds: [],
  favoriteRequests: [],
  meta: null,
  idsLoaded: false,
  idsLoading: false,
  listLoading: false,
  actionLoadingById: {},
  error: null,
  setFavoriteIds: (favoriteIds) =>
    set({
      favoriteIds,
      idsLoaded: true,
    }),
  addFavoriteId: (requestId) =>
    set((state) => ({
      favoriteIds: state.favoriteIds.includes(requestId)
        ? state.favoriteIds
        : [requestId, ...state.favoriteIds],
    })),
  removeFavoriteId: (requestId) =>
    set((state) => ({
      favoriteIds: state.favoriteIds.filter((id) => id !== requestId),
    })),
  setFavoriteRequests: (requests, meta = null) =>
    set({
      favoriteRequests: sortByFavoritedAt(requests),
      meta,
    }),
  upsertFavoriteRequest: (request) =>
    set((state) => {
      const next = state.favoriteRequests.filter((item) => item.id !== request.id);
      next.unshift(request);

      return {
        favoriteRequests: sortByFavoritedAt(next),
      };
    }),
  removeFavoriteRequest: (requestId) =>
    set((state) => ({
      favoriteRequests: state.favoriteRequests.filter((request) => request.id !== requestId),
    })),
  setIdsLoading: (idsLoading) => set({ idsLoading }),
  setListLoading: (listLoading) => set({ listLoading }),
  setActionLoading: (requestId, loading) =>
    set((state) => ({
      actionLoadingById: {
        ...state.actionLoadingById,
        [requestId]: loading,
      },
    })),
  setError: (error) => set({ error }),
  clearFavorites: () =>
    set((state) => {
      const alreadyCleared =
        state.favoriteIds.length === 0 &&
        state.favoriteRequests.length === 0 &&
        state.meta === null &&
        state.idsLoaded === false &&
        state.idsLoading === false &&
        state.listLoading === false &&
        Object.keys(state.actionLoadingById).length === 0 &&
        state.error === null;

      if (alreadyCleared) {
        return state;
      }

      return {
        favoriteIds: [],
        favoriteRequests: [],
        meta: null,
        idsLoaded: false,
        idsLoading: false,
        listLoading: false,
        actionLoadingById: {},
        error: null,
      };
    }),
}));
