import apiClient from "@/api/api-client";

export const getFavoriteRequestsApi = (params?: Record<string, any>) => {
  return apiClient.get("/favorites", { params: params ?? {} });
};

export const getFavoriteRequestIdsApi = () => {
  return apiClient.get("/favorites/ids");
};

export const addFavoriteApi = (requestId: string) => {
  return apiClient.post(`/favorites/${requestId}`);
};

export const removeFavoriteApi = (requestId: string) => {
  return apiClient.delete(`/favorites/${requestId}`);
};

export const getFavoriteStatusApi = (requestId: string) => {
  return apiClient.get(`/favorites/${requestId}/status`);
};
