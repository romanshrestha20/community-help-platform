export type RequestFormState = {
  title: string;
  description: string;
  categoryId: string;
  budget: string;
  isUrgent: boolean;
  urgentDurationMinutes: 30 | 60 | 120 | 240;
  city: string;
  country: string;
};

export const DEFAULT_REQUEST_FORM: RequestFormState = {
  title: "",
  description: "",
  categoryId: "",
  budget: "",
  isUrgent: false,
  urgentDurationMinutes: 120,
  city: "",
  country: "",
};
