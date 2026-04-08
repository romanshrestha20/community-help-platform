import { useCallback, useState } from "react";
import { showErrorToast, showSuccessToast } from "./toast";

const getErrorMessage = (err: unknown): string => {
    if (!err || typeof err !== "object") {
        return "Something went wrong";
    }

    const maybeAxiosError = err as {
        response?: {
            data?: {
                message?: string;
                error?: { message?: string };
            };
        };
        message?: string;
    };

    return (
        maybeAxiosError.response?.data?.message ||
        maybeAxiosError.response?.data?.error?.message ||
        maybeAxiosError.message ||
        "Something went wrong"
    );
};

export interface AsyncRunOptions {
    showErrorToast?: boolean;
    successMessage?: string;
    errorMessage?: string;
}

/**
 * Hook for managing async operations with built-in error handling and toast notifications
 *
 * @example
 * const { loading, error, run } = useAsync();
 *
 * const handleSubmit = async () => {
 *   await run(
 *     () => api.submitForm(data),
 *     { successMessage: "Form submitted!", showErrorToast: true }
 *   );
 * };
 */
export const useAsync = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = useCallback(
        async <T,>(
            fn: () => Promise<T>,
            options: AsyncRunOptions = {}
        ): Promise<T | null> => {
            const {
                showErrorToast: shouldShowErrorToast = true,
                successMessage,
                errorMessage,
            } = options;

            setLoading(true);
            setError(null);

            try {
                const result = await fn();

                if (successMessage) {
                    showSuccessToast(successMessage);
                }

                return result;
            } catch (err: unknown) {
                const message = getErrorMessage(err);
                setError(message);

                if (shouldShowErrorToast) {
                    showErrorToast(errorMessage || "Error", message);
                }

                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { loading, error, run };
};