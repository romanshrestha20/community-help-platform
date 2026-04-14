import * as favoriteApi from "@/features/favorites/api/favorite.api";
import {
  AddFavoriteResponse,
  FavoriteIdsResponse,
  FavoriteListMeta,
  FavoriteListResponse,
  FavoriteRequest,
  FavoriteStatusResponse,
  RemoveFavoriteResponse,
} from "@/features/favorites/types/favorite.type";
import { HelpRequest, HelpRequestImage } from "@/features/helpRequest/types/helpRequest.types";
type UnknownRecord = Record<string, any>;

const handleResponse = <T extends { success: boolean; data: unknown; message?: string }>(
  response: T
): T["data"] => {
  if (!response.success) {
    throw new Error(response.message || "Request failed");
  }

  return response.data;
};

const normalizeImage = (image: UnknownRecord): HelpRequestImage | null => {
  if (!image || typeof image !== "object") return null;

  const resolvedUrl = image.url ?? image.uri ?? image.secureUrl ?? image.secure_url;
  if (!resolvedUrl) return null;

  return {
    id: image.id ?? resolvedUrl,
    url: resolvedUrl,
    type: image.type,
    requestId: image.requestId,
  };
};

const normalizeFavoriteRequest = (request: FavoriteRequest | UnknownRecord): HelpRequest => {
  const imagesSource: UnknownRecord[] =
    (Array.isArray(request.images) && request.images) ||
    (Array.isArray((request as UnknownRecord).requestImages) &&
      (request as UnknownRecord).requestImages) ||
    [];

  return {
    ...request,
    requesterName: request.requesterName ?? "Community member",
    images: imagesSource
      .map((image) => normalizeImage(image))
      .filter((image): image is HelpRequestImage => Boolean(image)),
  } as HelpRequest;
};

export const getFavoriteRequests = async (
  params?: Record<string, any>
): Promise<{ requests: HelpRequest[]; meta: FavoriteListMeta }> => {
  const response = await favoriteApi.getFavoriteRequestsApi(params);
  const payload = response.data as FavoriteListResponse;
  const requests = handleResponse(payload) as FavoriteRequest[];

  return {
    requests: requests.map((request) => normalizeFavoriteRequest(request)),
    meta: payload.meta,
  };
};

export const getFavoriteRequestIds = async (): Promise<string[]> => {
  const response = await favoriteApi.getFavoriteRequestIdsApi();
  const payload = response.data as FavoriteIdsResponse;
  return handleResponse(payload) as string[];
};

export const addFavorite = async (
  requestId: string
): Promise<{ request: HelpRequest; created: boolean }> => {
  const response = await favoriteApi.addFavoriteApi(requestId);
  const payload = response.data as AddFavoriteResponse;
  const favoriteRequest = handleResponse(payload) as FavoriteRequest;

  return {
    request: normalizeFavoriteRequest(favoriteRequest),
    created: Boolean(payload.meta?.created),
  };
};

export const removeFavorite = async (requestId: string): Promise<boolean> => {
  const response = await favoriteApi.removeFavoriteApi(requestId);
  const payload = response.data as RemoveFavoriteResponse;
  const data = handleResponse(payload) as RemoveFavoriteResponse["data"];
  return Boolean(data.removed);
};

export const getFavoriteStatus = async (requestId: string): Promise<boolean> => {
  const response = await favoriteApi.getFavoriteStatusApi(requestId);
  const payload = response.data as FavoriteStatusResponse;
  const data = handleResponse(payload) as FavoriteStatusResponse["data"];
  return Boolean(data.favorited);
};
