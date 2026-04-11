import { z } from "zod";

export const getZodErrorMessage = (error: z.ZodError) => {
    return error.issues[0]?.message ?? "Invalid request";
};
