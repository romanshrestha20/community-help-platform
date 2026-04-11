import { AppLocation } from "@/features/location/types/location.types";
import { HelpRequestStatus } from "@/features/helpRequest/types/helpRequest.types";

import {
    firstValidationError,
    requireValue,
    validateDateOfBirth,
    validateEmail,
    validatePassword,
    validatePhoneNumber,
} from "./validators";

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
type RequestField = "title" | "description" | "budget" | "location";
type BidField = "helpRequestId" | "amount" | "message";
type ProfileField = "fullName" | "dateOfBirth" | "bio";

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

const toValidationResult = <TField extends string>(
    fieldErrors: FieldErrorMap<TField>,
    fallbackFormError?: string | null
): FormValidationResult<TField> => {
    const firstFieldError = firstValidationError(
        ...(Object.values(fieldErrors) as Array<string | null | undefined>)
    );
    const formError = firstValidationError(fallbackFormError ?? null, firstFieldError);

    return {
        fieldErrors,
        formError,
        isValid: !formError,
    };
};

export const validateLoginFormFields = ({
    email,
    password,
}: LoginValidationArgs): FormValidationResult<LoginField> => {
    return toValidationResult<LoginField>({
        email: validateEmail(email) ?? undefined,
        password: validatePassword(password) ?? undefined,
    });
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
    return toValidationResult<RegisterField>({
        fullName: requireValue(fullName, "Full name is required.") ?? undefined,
        email: validateEmail(email) ?? undefined,
        phone: validatePhoneNumber(phone) ?? undefined,
        password: validatePassword(password) ?? undefined,
        dateOfBirth: validateDateOfBirth(dateOfBirth) ?? undefined,
        location: location ? undefined : "Please select your location.",
    });
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
    return toValidationResult<ChangePasswordField>({
        currentPassword:
            validatePassword(currentPassword, {
                requiredMessage: "Current password is required.",
                minLength: 1,
            }) ?? undefined,
        newPassword: validatePassword(newPassword) ?? undefined,
    });
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

export const validatePasswordConfirmation = (password: string) => {
    return validatePassword(password, {
        requiredMessage: "Please enter your password.",
        minLength: 1,
    });
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
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const budgetResult = parseBudgetInput(budgetInput);

    const titleError = (() => {
        if (!normalizedTitle) return "Title is required.";
        if (normalizedTitle.length < REQUEST_TITLE_MIN_LENGTH) {
            return `Title must be at least ${REQUEST_TITLE_MIN_LENGTH} characters.`;
        }
        if (normalizedTitle.length > REQUEST_TITLE_MAX_LENGTH) {
            return `Title must be ${REQUEST_TITLE_MAX_LENGTH} characters or fewer.`;
        }
        return undefined;
    })();

    const descriptionError = (() => {
        if (!normalizedDescription) return "Description is required.";
        if (normalizedDescription.length < REQUEST_DESCRIPTION_MIN_LENGTH) {
            return `Description must be at least ${REQUEST_DESCRIPTION_MIN_LENGTH} characters.`;
        }
        if (normalizedDescription.length > REQUEST_DESCRIPTION_MAX_LENGTH) {
            return `Description must be ${REQUEST_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
        }
        return undefined;
    })();

    return toValidationResult<RequestField>({
        title: titleError,
        description: descriptionError,
        budget: budgetResult.error,
        location: location ? undefined : "Please choose a location.",
    });
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
    const normalizedMessage = message.trim();

    const messageError = (() => {
        if (normalizedMessage.length < BID_MESSAGE_MIN_LENGTH) {
            return `Message must be at least ${BID_MESSAGE_MIN_LENGTH} characters.`;
        }
        if (normalizedMessage.length > BID_MESSAGE_MAX_LENGTH) {
            return `Message must be ${BID_MESSAGE_MAX_LENGTH} characters or fewer.`;
        }
        return undefined;
    })();

    return toValidationResult<BidField>(
        {
            helpRequestId:
                mode === "create" && !helpRequestId
                    ? "Unable to submit bid without a request id."
                    : undefined,
            amount: parsedAmount.error,
            message: messageError,
        },
        requestStatus && requestStatus !== "OPEN"
            ? "Bidding is only available while a request is open."
            : null
    );
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
    dateOfBirth,
    bio,
}: ValidateProfileUpdateArgs): FormValidationResult<ProfileField> => {
    const normalizedName = fullName.trim();
    const dateError = dateOfBirth?.trim() ? validateDateOfBirth(dateOfBirth) : null;
    const normalizedBio = bio?.trim() ?? "";

    const fullNameError = (() => {
        if (!normalizedName) {
            return "Full name is required.";
        }
        if (normalizedName.length < PROFILE_FULL_NAME_MIN_LENGTH) {
            return `Full name must be at least ${PROFILE_FULL_NAME_MIN_LENGTH} characters.`;
        }
        if (normalizedName.length > PROFILE_FULL_NAME_MAX_LENGTH) {
            return `Full name must be ${PROFILE_FULL_NAME_MAX_LENGTH} characters or fewer.`;
        }
        return undefined;
    })();

    return toValidationResult<ProfileField>({
        fullName: fullNameError,
        dateOfBirth: dateError ?? undefined,
        bio:
            normalizedBio.length > PROFILE_BIO_MAX_LENGTH
                ? `Bio must be ${PROFILE_BIO_MAX_LENGTH} characters or fewer.`
                : undefined,
    });
};

export const validateProfileUpdateForm = ({
    fullName,
    dateOfBirth,
    bio,
}: ValidateProfileUpdateArgs) => {
    return validateProfileUpdateFormFields({ fullName, dateOfBirth, bio }).formError;
};