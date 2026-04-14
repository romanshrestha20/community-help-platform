import { getCategoriesApi } from "@/features/category/api/category.api";
import { AppCategory, CategoryApiResponse } from "@/features/category/types/category.types";

export const getCategories = async (): Promise<AppCategory[]> => {
  const response = await getCategoriesApi();
  const payload = response.data as CategoryApiResponse;

  if (!payload.success) {
    throw new Error(payload.message || "Failed to fetch categories");
  }

  return payload.data;
};
