import { useCallback } from "react";

import { showSuccessToast } from "@/utils/toast";
import { HelpRequest } from "@/features/helpRequest/types/helpRequest.types";
import * as favoriteService from "@/features/favorites/services/favorite.service";
import { useFavoriteStore } from "@/features/favorites/store/favorite.store";

const getErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return "Something went wrong";
  }

  const maybeAxiosError = error as {
    response?: {
      data?: {
        message?: string;
        error?: { message?: string };
      };
    };
    message?: string;
  };

  return (
    maybeAxiosError.response?.data?.message ||
    maybeAxiosError.response?.data?.error?.message ||
    maybeAxiosError.message ||
    "Something went wrong"
  );
};

export const useFavorites = () => {
  const {
    favoriteIds,
    favoriteRequests,
    meta,
    idsLoaded,
    idsLoading,
    listLoading,
    actionLoadingById,
    error,
    setFavoriteIds,
    addFavoriteId,
    removeFavoriteId,
    setFavoriteRequests,
    upsertFavoriteRequest,
    removeFavoriteRequest,
    setIdsLoading,
    setListLoading,
    setActionLoading,
    setError,
    clearFavorites,
  } = useFavoriteStore();
  

  const isFavorite = useCallback(
    (requestId: string) => favoriteIds.includes(requestId),
    [favoriteIds]
  );

  const loadFavoriteIds = useCallback(
    async (force = false) => {
      if ((idsLoaded || idsLoading) && !force) {
        return favoriteIds;
      }

      setIdsLoading(true);
      setError(null);

      try {
        const ids = await favoriteService.getFavoriteRequestIds();
        setFavoriteIds(ids);
        return ids;
      } catch (err) {
        setError(getErrorMessage(err));
        return favoriteIds;
      } finally {
        setIdsLoading(false);
      }
    },
    [favoriteIds, idsLoaded, idsLoading, setError, setFavoriteIds, setIdsLoading]
  );

  const loadFavoriteRequests = useCallback(
    async (params?: Record<string, any>) => {
      setListLoading(true);
      setError(null);

      try {
        const result = await favoriteService.getFavoriteRequests(params);
        setFavoriteRequests(result.requests, result.meta);
        return result.requests;
      } catch (err) {
        setError(getErrorMessage(err));
        return [];
      } finally {
        setListLoading(false);
      }
    },
    [setError, setFavoriteRequests, setListLoading]
  );

  const toggleFavorite = useCallback(
    async (request: HelpRequest) => {
      if (actionLoadingById[request.id]) {
        return null;
      }

      const currentlyFavorited = isFavorite(request.id);
      setActionLoading(request.id, true);
      setError(null);

      try {
        if (currentlyFavorited) {
          const removed = await favoriteService.removeFavorite(request.id);

          if (removed) {
            removeFavoriteId(request.id);
            removeFavoriteRequest(request.id);
            showSuccessToast("Removed from favorites");
          }

          return false;
        }

        const result = await favoriteService.addFavorite(request.id);
        addFavoriteId(request.id);
        upsertFavoriteRequest({
          ...result.request,
          favoritedAt: result.request.favoritedAt ?? new Date().toISOString(),
        });
        showSuccessToast(result.created ? "Saved to favorites" : "Already in favorites");
        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        return null;
      } finally {
        setActionLoading(request.id, false);
      }
    },
    [
      actionLoadingById,
      addFavoriteId,
      isFavorite,
      removeFavoriteId,
      removeFavoriteRequest,
      setActionLoading,
      setError,
      upsertFavoriteRequest,
    ]
  );

  return {
    favoriteIds,
    favoriteRequests,
    meta,
    idsLoaded,
    idsLoading,
    listLoading,
    actionLoadingById,
    error,
    isFavorite,
    loadFavoriteIds,
    loadFavoriteRequests,
    toggleFavorite,
    clearFavorites,
  };
};
