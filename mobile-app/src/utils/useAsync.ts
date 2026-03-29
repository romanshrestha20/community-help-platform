// src/utils/useAsync.ts
import { useCallback, useState } from "react";

export const useAsync = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
        setLoading(true);
        setError(null);

        try {
            const result = await fn();
            return result;
        } catch (err: any) {
            setError(err?.message || "Something went wrong");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, run };
};