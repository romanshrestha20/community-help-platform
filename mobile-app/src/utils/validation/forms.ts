import { z } from "zod";

import { AppLocation } from "@/features/location/types/location.types";
import { HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";
import { normalizePhoneInput } from "@/utils/phone";

import { firstValidationError, validateDateOfBirth } from "./validators";

export type FieldErrorMap<TField extends string = string> = Partial<Record<TField, string>>;

export type FormValidationResult<TField extends string = string> = {
    fieldErrors: FieldErrorMap<TField>;
    formError: string | null;
    isValid: boolean;
};

type LoginValidationArgs = {
    email: string;
    password: string;
};

type RegisterValidationArgs = {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    dateOfBirth: string;
    location: AppLocation | null;
};

type ChangePasswordValidationArgs = {
    currentPassword: string;
    newPassword: string;
};

type ForgotPasswordValidationArgs = {
    email: string;
};

type ResetPasswordValidationArgs = {
    newPassword: string;
    confirmPassword: string;
};

type VerifyPhoneCodeValidationArgs = {
    code: string;
};

type ValidateRequestDraftArgs = {
    title: string;
    description: string;
    budgetInput: string;
    location: AppLocation | null;
};

type ValidateBidDraftArgs = {
    amountInput: string;
    message: string;
    helpRequestId?: string;
    requestStatus?: HelpRequestStatus;
    mode: "create" | "edit";
};

type ValidateProfileUpdateArgs = {
    fullName: string;
    phone?: string;
    dateOfBirth?: string;
    bio?: string;
};

type LoginField = "email" | "password";
type RegisterField =
    | "fullName"
    | "email"
    | "phone"
    | "password"
    | "dateOfBirth"
    | "location";
type ChangePasswordField = "currentPassword" | "newPassword";
type ForgotPasswordField = "email";
type ResetPasswordField = "newPassword" | "confirmPassword";
type VerifyPhoneCodeField = "code";
type RequestField = "title" | "description" | "budget" | "location";
type BidField = "helpRequestId" | "amount" | "message";
type ProfileField = "fullName" | "phone" | "dateOfBirth" | "bio";

type ParseAmountResult = {
    amount?: number;
    error?: string;
};

export const REQUEST_TITLE_MIN_LENGTH = 5;
export const REQUEST_TITLE_MAX_LENGTH = 120;
export const REQUEST_DESCRIPTION_MIN_LENGTH = 20;
export const REQUEST_DESCRIPTION_MAX_LENGTH = 1200;

export const BID_MESSAGE_MIN_LENGTH = 10;
export const BID_MESSAGE_MAX_LENGTH = 600;

export const PROFILE_FULL_NAME_MIN_LENGTH = 2;
export const PROFILE_FULL_NAME_MAX_LENGTH = 80;
export const PROFILE_BIO_MAX_LENGTH = 280;

const PASSWORD_MIN_LENGTH = 8;

const toValidationResult = <TField extends string>(
    result: any,
    fallbackFormError?: string | null
): FormValidationResult<TField> => {
    if (result.success) {
        return {
            fieldErrors: {},
            formError: fallbackFormError ?? null,
            isValid: !fallbackFormError,
        };
    }

    const fieldErrors: FieldErrorMap<TField> = {};
    let formError = fallbackFormError ?? null;

    for (const issue of result.error.issues) {
        const fieldName = issue.path[0];

        if (typeof fieldName === "string") {
            if (!fieldErrors[fieldName as TField]) {
                fieldErrors[fieldName as TField] = issue.message;
            }
            continue;
        }

        formError = firstValidationError(formError, issue.message);
    }

    const firstFieldError = firstValidationError(
        ...(Object.values(fieldErrors) as (string | null | undefined)[])
    );

    return {
        fieldErrors,
        formError: firstValidationError(formError, firstFieldError),
        isValid: !firstValidationError(formError, firstFieldError),
    };
};

const locationRequiredIssue = (message: string) =>
    z.any().refine((value) => Boolean(value), {
        message,
    });

const emailSchema = z.string().trim().min(1, "Email is required.").email("Please enter a valid email address.");

const passwordSchema = (options?: { requiredMessage?: string; minLength?: number }) =>
    z
        .string()
        .trim()
        .min(1, options?.requiredMessage ?? "Password is required.")
        .min(options?.minLength ?? PASSWORD_MIN_LENGTH, `Password must be at least ${options?.minLength ?? PASSWORD_MIN_LENGTH} characters.`);

const phoneSchema = z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((value) => {
        const normalized = normalizePhoneInput(value);
        return /^\+?\d{7,15}$/.test(normalized);
    }, "Please enter a valid phone number.");

const dateOfBirthSchema = (requiredMessage = "Date of birth is required.") =>
    z
        .string()
        .trim()
        .min(1, requiredMessage)
        .refine((value) => validateDateOfBirth(value) === null, {
            message: "Please enter a valid date of birth.",
        });

const fullNameSchema = (requiredMessage = "Full name is required.") =>
    z
        .string()
        .trim()
        .min(1, requiredMessage);

const maybeDateOfBirthSchema = z
    .string()
    .trim()
    .optional()
    .superRefine((value, ctx) => {
        if (value && validateDateOfBirth(value) !== null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please enter a valid date of birth.",
            });
        }
    });

const requestTitleSchema = z
    .string()
    .trim()
    .min(REQUEST_TITLE_MIN_LENGTH, `Title must be at least ${REQUEST_TITLE_MIN_LENGTH} characters.`)
    .max(REQUEST_TITLE_MAX_LENGTH, `Title must be ${REQUEST_TITLE_MAX_LENGTH} characters or fewer.`);

const requestDescriptionSchema = z
    .string()
    .trim()
    .min(REQUEST_DESCRIPTION_MIN_LENGTH, `Description must be at least ${REQUEST_DESCRIPTION_MIN_LENGTH} characters.`)
    .max(REQUEST_DESCRIPTION_MAX_LENGTH, `Description must be ${REQUEST_DESCRIPTION_MAX_LENGTH} characters or fewer.`);

const bidAmountSchema = z
    .string()
    .trim()
    .min(1, "Bid amount is required.")
    .refine((value) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric > 0;
    }, "Bid amount must be greater than 0.");

const bidMessageSchema = z
    .string()
    .trim()
    .min(BID_MESSAGE_MIN_LENGTH, `Message must be at least ${BID_MESSAGE_MIN_LENGTH} characters.`)
    .max(BID_MESSAGE_MAX_LENGTH, `Message must be ${BID_MESSAGE_MAX_LENGTH} characters or fewer.`);

const profileFullNameSchema = z
    .string()
    .trim()
    .min(PROFILE_FULL_NAME_MIN_LENGTH, `Full name must be at least ${PROFILE_FULL_NAME_MIN_LENGTH} characters.`)
    .max(PROFILE_FULL_NAME_MAX_LENGTH, `Full name must be ${PROFILE_FULL_NAME_MAX_LENGTH} characters or fewer.`);

const profileBioSchema = z
    .string()
    .trim()
    .optional();

export const validateLoginFormFields = ({
    email,
    password,
}: LoginValidationArgs): FormValidationResult<LoginField> => {
    const result = z.object({
        email: emailSchema,
        password: passwordSchema(),
    }).safeParse({ email, password });

    return toValidationResult<LoginField>(result);
};

export const validateLoginForm = ({ email, password }: LoginValidationArgs) => {
    return validateLoginFormFields({ email, password }).formError;
};

export const validateRegisterFormFields = ({
    fullName,
    email,
    phone,
    password,
    dateOfBirth,
    location,
}: RegisterValidationArgs): FormValidationResult<RegisterField> => {
    const result = z
        .object({
            fullName: fullNameSchema(),
            email: emailSchema,
            phone: phoneSchema,
            password: passwordSchema(),
            dateOfBirth: dateOfBirthSchema(),
            location: locationRequiredIssue("Please select your location."),
        })
        .safeParse({ fullName, email, phone, password, dateOfBirth, location });

    return toValidationResult<RegisterField>(result);
};

export const validateRegisterForm = ({
    fullName,
    email,
    phone,
    password,
    dateOfBirth,
    location,
}: RegisterValidationArgs) => {
    return validateRegisterFormFields({
        fullName,
        email,
        phone,
        password,
        dateOfBirth,
        location,
    }).formError;
};

export const validateChangePasswordFormFields = ({
    currentPassword,
    newPassword,
}: ChangePasswordValidationArgs): FormValidationResult<ChangePasswordField> => {
    const result = z.object({
        currentPassword: passwordSchema({ requiredMessage: "Current password is required.", minLength: 1 }),
        newPassword: passwordSchema(),
    }).safeParse({ currentPassword, newPassword });

    return toValidationResult<ChangePasswordField>(result);
};

export const validateChangePasswordForm = ({
    currentPassword,
    newPassword,
}: ChangePasswordValidationArgs) => {
    return validateChangePasswordFormFields({
        currentPassword,
        newPassword,
    }).formError;
};

export const validateForgotPasswordFormFields = ({
    email,
}: ForgotPasswordValidationArgs): FormValidationResult<ForgotPasswordField> => {
    const result = z.object({
        email: emailSchema,
    }).safeParse({ email });

    return toValidationResult<ForgotPasswordField>(result);
};

export const validateForgotPasswordForm = ({ email }: ForgotPasswordValidationArgs) => {
    return validateForgotPasswordFormFields({ email }).formError;
};

export const validateResetPasswordFormFields = ({
    newPassword,
    confirmPassword,
}: ResetPasswordValidationArgs): FormValidationResult<ResetPasswordField> => {
    const result = z
        .object({
            newPassword: passwordSchema({ requiredMessage: "New password is required." }),
            confirmPassword: passwordSchema({ requiredMessage: "Please confirm your password." }),
        })
        .superRefine((data, ctx) => {
            if (data.newPassword !== data.confirmPassword) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["confirmPassword"],
                    message: "Passwords do not match.",
                });
            }
        })
        .safeParse({ newPassword, confirmPassword });

    return toValidationResult<ResetPasswordField>(result);
};

export const validateResetPasswordForm = ({
    newPassword,
    confirmPassword,
}: ResetPasswordValidationArgs) => {
    return validateResetPasswordFormFields({ newPassword, confirmPassword }).formError;
};

export const validateVerifyPhoneCodeFormFields = ({
    code,
}: VerifyPhoneCodeValidationArgs): FormValidationResult<VerifyPhoneCodeField> => {
    const result = z.object({
        code: z
            .string()
            .trim()
            .regex(/^\d{6}$/, "Verification code must be 6 digits."),
    }).safeParse({ code });

    return toValidationResult<VerifyPhoneCodeField>(result);
};

export const validateVerifyPhoneCodeForm = ({ code }: VerifyPhoneCodeValidationArgs) => {
    return validateVerifyPhoneCodeFormFields({ code }).formError;
};

export const validatePasswordConfirmation = (password: string) => {
    const result = passwordSchema({ requiredMessage: "Please enter your password.", minLength: 1 }).safeParse(password);

    return result.success ? null : result.error.issues[0]?.message ?? "Please enter your password.";
};

export const parseBudgetInput = (budgetInput: string): ParseAmountResult => {
    const trimmed = budgetInput.trim();
    if (!trimmed) {
        return { amount: undefined };
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return { error: "Budget must be a valid number greater than 0." };
    }

    return { amount: numeric };
};

export const validateRequestDraft = ({
    title,
    description,
    budgetInput,
    location,
}: ValidateRequestDraftArgs): string | null => {
    return validateRequestDraftFields({ title, description, budgetInput, location }).formError;
};

export const validateRequestDraftFields = ({
    title,
    description,
    budgetInput,
    location,
}: ValidateRequestDraftArgs): FormValidationResult<RequestField> => {
    const budgetResult = parseBudgetInput(budgetInput);

    const result = z
        .object({
            title: requestTitleSchema,
            description: requestDescriptionSchema,
            location: locationRequiredIssue("Please choose a location."),
        })
        .superRefine((data, ctx) => {
            if (budgetResult.error) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["budget"],
                    message: budgetResult.error,
                });
            }
        })
        .safeParse({ title, description, budgetInput, location });

    return toValidationResult<RequestField>(result);
};

export const parseBidAmountInput = (amountInput: string): ParseAmountResult => {
    const trimmed = amountInput.trim();
    if (!trimmed) {
        return { error: "Bid amount is required." };
    }

    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return { error: "Bid amount must be greater than 0." };
    }

    return { amount: numeric };
};

export const validateBidDraftFields = ({
    amountInput,
    message,
    helpRequestId,
    requestStatus,
    mode,
}: ValidateBidDraftArgs): FormValidationResult<BidField> => {
    const parsedAmount = parseBidAmountInput(amountInput);

    const result = z
        .object({
            helpRequestId: z.string().trim().optional(),
            amountInput: bidAmountSchema,
            message: bidMessageSchema,
            mode: z.enum(["create", "edit"]),
        })
        .superRefine((data, ctx) => {
            if (mode === "create" && !helpRequestId) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["helpRequestId"],
                    message: "Unable to submit bid without a request id.",
                });
            }

            if (parsedAmount.error) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["amount"],
                    message: parsedAmount.error,
                });
            }

            if (requestStatus && requestStatus !== "OPEN") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Bidding is only available while a request is open.",
                });
            }
        })
        .safeParse({
            helpRequestId,
            amountInput,
            message,
            mode,
        });

    return toValidationResult<BidField>(result, requestStatus && requestStatus !== "OPEN" ? "Bidding is only available while a request is open." : null);
};

export const validateBidDraft = ({
    amountInput,
    message,
    helpRequestId,
    requestStatus,
    mode,
}: ValidateBidDraftArgs): string | null => {
    return validateBidDraftFields({
        amountInput,
        message,
        helpRequestId,
        requestStatus,
        mode,
    }).formError;
};

export const validateProfileUpdateFormFields = ({
    fullName,
    phone,
    dateOfBirth,
    bio,
}: ValidateProfileUpdateArgs): FormValidationResult<ProfileField> => {
    const result = z
        .object({
            fullName: profileFullNameSchema,
            phone: phoneSchema.optional(),
            dateOfBirth: maybeDateOfBirthSchema,
            bio: profileBioSchema,
        })
        .superRefine((data, ctx) => {
            const normalizedBio = data.bio?.trim() ?? "";

            if (normalizedBio.length > PROFILE_BIO_MAX_LENGTH) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["bio"],
                    message: `Bio must be ${PROFILE_BIO_MAX_LENGTH} characters or fewer.`,
                });
            }
        })
        .safeParse({ fullName, phone, dateOfBirth, bio });

    return toValidationResult<ProfileField>(result);
};

export const validateProfileUpdateForm = ({
    fullName,
    phone,
    dateOfBirth,
    bio,
}: ValidateProfileUpdateArgs) => {
    return validateProfileUpdateFormFields({ fullName, phone, dateOfBirth, bio }).formError;
};
