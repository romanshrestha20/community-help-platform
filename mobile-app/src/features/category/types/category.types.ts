export interface AppCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  sortOrder?: number;
}

export interface CategoryApiResponse {
  success: boolean;
  data: AppCategory[];
  message?: string;
  meta?: {
    total?: number;
  };
}
