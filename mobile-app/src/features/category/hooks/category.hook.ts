import { useCallback, useEffect, useState } from "react";

import { AppCategory } from "@/features/category/types/category.types";
import { getCategories } from "@/features/category/services/category.service";

export const useCategories = () => {
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCategories();
      setCategories(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch categories";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    loadCategories,
  };
};
