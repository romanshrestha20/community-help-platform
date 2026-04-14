import apiClient from "@/api/api-client";

export const getCategoriesApi = () => {
  return apiClient.get("/categories");
};
