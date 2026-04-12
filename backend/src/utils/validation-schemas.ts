import { z } from "zod";

const emailSchema = z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address.");

const passwordSchema = (requiredMessage = "Password is required.") =>
    z.string().trim().min(1, requiredMessage);

const phoneSchema = z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((value) => value.replace(/[^\d+]/g, "").replace(/\D/g, "").length >= 7, {
        message: "Please enter a valid phone number.",
    });

const dateOfBirthSchema = z
    .string()
    .trim()
    .min(1, "Date of birth is required.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format.");

const genderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);

const requestCategorySchema = z.enum(["FOOD", "MEDICAL", "EDUCATION", "OTHER"]);
const requestStatusSchema = z.enum(["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"]);
const bidStatusSchema = z.enum(["ACCEPTED", "REJECTED"]);

const requiredPositiveNumber = (message: string) =>
    z.preprocess((value) => value, z.coerce.number().positive(message));

const optionalPositiveNumber = (message: string) =>
    z.preprocess((value) => {
        if (value === "" || value === null || value === undefined) {
            return undefined;
        }

        return value;
    }, z.coerce.number().positive(message).optional());

const optionalPositiveInteger = (message: string) =>
    z.preprocess((value) => {
        if (value === "" || value === null || value === undefined) {
            return undefined;
        }

        return value;
    }, z.coerce.number().int().positive(message).optional());

const optionalBoolean = z.preprocess((value) => {
    if (value === true || value === "true" || value === 1 || value === "1") return true;
    if (value === false || value === "false" || value === 0 || value === "0") return false;
    return value;
}, z.boolean().optional());

const optionalLocationPayload = z.unknown().optional();

export const registerUserBodySchema = z.object({
    email: emailSchema,
    password: passwordSchema(),
    phone: phoneSchema,
    fullName: z.string().trim().min(1, "Full name is required."),
    gender: genderSchema,
    dateOfBirth: dateOfBirthSchema,
});

export const loginBodySchema = z.object({
    email: emailSchema,
    password: passwordSchema(),
});

export const changePasswordBodySchema = z.object({
    currentPassword: passwordSchema("Current password is required."),
    newPassword: passwordSchema("New password is required."),
});

export const refreshTokenBodySchema = z.object({
    refreshToken: z.string().trim().min(1, "Refresh token is required."),
});

export const pushTokenBodySchema = z.object({
    token: z.string().trim().min(1, "Push token is required."),
    platform: z.string().trim().optional().nullable(),
});

export const createHelpRequestBodySchema = z.object({
    title: z.string().trim().min(1, "Title is required."),
    description: z.string().trim().min(1, "Description is required."),
    category: requestCategorySchema,
    budget: optionalPositiveNumber("Budget must be a valid number greater than 0."),
    isPaid: optionalBoolean,
    serviceRadiusMeters: optionalPositiveInteger("Service radius must be a positive whole number."),
    location: optionalLocationPayload,
});

export const updateHelpRequestBodySchema = z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    category: requestCategorySchema.optional(),
    budget: optionalPositiveNumber("Budget must be a valid number greater than 0.").optional(),
    isPaid: optionalBoolean.optional(),
    serviceRadiusMeters: optionalPositiveInteger("Service radius must be a positive whole number.").optional(),
    location: optionalLocationPayload,
});

export const updateHelpRequestStatusBodySchema = z.object({
    status: requestStatusSchema,
});

export const placeBidBodySchema = z.object({
    helpRequestId: z.string().trim().min(1, "Request ID is required."),
    message: z.string().trim().min(1, "Message is required."),
    amount: requiredPositiveNumber("Bid amount must be greater than 0."),
});

export const respondToBidBodySchema = z.object({
    status: bidStatusSchema,
});

export const updateBidBodySchema = z
    .object({
        message: z.string().trim().min(1).optional(),
        amount: optionalPositiveNumber("Amount must be greater than 0.").optional(),
    })
    .superRefine((data, ctx) => {
        if (data.message === undefined && data.amount === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "At least one field (message or amount) is required",
            });
        }
    });

export const conversationIdParamSchema = z.object({
    conversationId: z.string().trim().min(1, "Conversation ID is required."),
});

export const requestIdParamSchema = z.object({
    requestId: z.string().trim().min(1, "Request ID is required."),
});

export const messageIdParamSchema = z.object({
    messageId: z.string().trim().min(1, "Message ID is required."),
});

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
});

export const conversationMessagesQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
    sort: z.enum(["asc", "desc"]).optional(),
});

export const sendConversationMessageBodySchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, "Message content is required.")
        .max(1000, "Message cannot exceed 1000 characters."),
});
