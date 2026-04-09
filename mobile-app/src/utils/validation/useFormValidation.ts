import { useCallback, useState } from "react";

export function useFormValidation() {
  const [validationError, setValidationError] = useState<string | null>(null);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  return {
    validationError,
    setValidationError,
    clearValidationError,
  };
}
