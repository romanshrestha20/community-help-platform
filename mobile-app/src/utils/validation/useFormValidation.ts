import { useCallback, useState } from "react";

type FieldErrorMap<TField extends string> = Partial<Record<TField, string>>;

export function useFormValidation<TField extends string = string>() {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap<TField>>({});

  const clearValidationError = useCallback(() => {
    setValidationError(null);
    setFieldErrors({});
  }, []);

  const clearFieldError = useCallback((field: TField) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const setFieldError = useCallback((field: TField, error: string | null) => {
    setFieldErrors((current) => {
      if (!error) {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      }

      if (current[field] === error) return current;
      return { ...current, [field]: error };
    });
  }, []);

  return {
    validationError,
    setValidationError,
    fieldErrors,
    setFieldErrors,
    setFieldError,
    clearFieldError,
    clearValidationError,
  };
}
