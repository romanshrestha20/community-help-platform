import { AppLocation } from "@/features/location/types/location.types";
import { RequestImageUploadInput } from "@/features/helpRequest/types/helpRequest.types";
import { validateRequestDraftFields } from "@/features/helpRequest/utils/requestValidation";
import { RequestFormState } from "@/features/helpRequest/types/requestForm.types";

export type RequestValidationField =
  | "title"
  | "description"
  | "categoryId"
  | "location"
  | "budget"
  | "images";

export type RequestValidationResult = {
  isValid: boolean;
  formError: string | null;
  fieldErrors: Partial<Record<RequestValidationField, string>>;
};

type Args = {
  form: RequestFormState;
  location: AppLocation | null;
  selectedImages: RequestImageUploadInput[];
  existingImageCount?: number;
  requireAtLeastOneImage?: boolean;
};

export const validateRequestForm = ({
  form,
  location,
  selectedImages,
  existingImageCount = 0,
  requireAtLeastOneImage = false,
}: Args): RequestValidationResult => {
  const base = validateRequestDraftFields({
    title: form.title,
    description: form.description,
    budgetInput: form.budget,
    location,
  });

  const fieldErrors: Partial<Record<RequestValidationField, string>> = {
    title: base.fieldErrors.title,
    description: base.fieldErrors.description,
    budget: base.fieldErrors.budget,
    location: base.fieldErrors.location,
  };

  if (!form.categoryId.trim()) {
    fieldErrors.categoryId = "Please choose a category.";
  }

  if (requireAtLeastOneImage && existingImageCount + selectedImages.length === 0) {
    fieldErrors.images = "Please add at least one photo.";
  }

  const orderedError =
    fieldErrors.title ||
    fieldErrors.description ||
    fieldErrors.categoryId ||
    fieldErrors.location ||
    fieldErrors.budget ||
    fieldErrors.images ||
    base.formError;

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    formError: orderedError ?? null,
    fieldErrors,
  };
};
