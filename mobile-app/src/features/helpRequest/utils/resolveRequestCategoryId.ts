import type { AppCategory } from "@/features/category/types/category.types";
import type { HelpRequest } from "../types/helpRequest.types";

export const resolveRequestCategoryId = (
  request: Pick<HelpRequest, "categoryId" | "category">,
  categories: AppCategory[] = []
) => {
  if (typeof request.categoryId === "string" && request.categoryId.trim()) {
    return request.categoryId;
  }

  if (request.category?.id) {
    return request.category.id;
  }

  if (request.category?.slug) {
    return categories.find((category) => category.slug === request.category?.slug)?.id ?? "";
  }

  return "";
};
