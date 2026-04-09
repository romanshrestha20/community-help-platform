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

export const validateLoginForm = ({ email, password }: LoginValidationArgs) => {
    return firstValidationError(validateEmail(email), validatePassword(password));
};

export const validateRegisterForm = ({
    fullName,
    email,
    phone,
    password,
    dateOfBirth,
    location,
}: RegisterValidationArgs) => {
    return firstValidationError(
        requireValue(fullName, "Full name is required."),
        validateEmail(email),
        validatePhoneNumber(phone),
        validatePassword(password),
        validateDateOfBirth(dateOfBirth),
        location ? null : "Please select your location."
    );
};

export const validateChangePasswordForm = ({
    currentPassword,
    newPassword,
}: ChangePasswordValidationArgs) => {
    return firstValidationError(
        validatePassword(currentPassword, {
            requiredMessage: "Current password is required.",
            minLength: 1,
        }),
        validatePassword(newPassword)
    );
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
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    if (!normalizedTitle || !normalizedDescription) {
        return "Title and description are required.";
    }

    if (normalizedTitle.length < REQUEST_TITLE_MIN_LENGTH) {
        return `Title must be at least ${REQUEST_TITLE_MIN_LENGTH} characters.`;
    }

    if (normalizedTitle.length > REQUEST_TITLE_MAX_LENGTH) {
        return `Title must be ${REQUEST_TITLE_MAX_LENGTH} characters or fewer.`;
    }

    if (normalizedDescription.length < REQUEST_DESCRIPTION_MIN_LENGTH) {
        return `Description must be at least ${REQUEST_DESCRIPTION_MIN_LENGTH} characters.`;
    }

    if (normalizedDescription.length > REQUEST_DESCRIPTION_MAX_LENGTH) {
        return `Description must be ${REQUEST_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
    }

    const budgetResult = parseBudgetInput(budgetInput);
    if (budgetResult.error) {
        return budgetResult.error;
    }

    if (!location) {
        return "Please choose a location.";
    }

    return null;
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

export const validateBidDraft = ({
    amountInput,
    message,
    helpRequestId,
    requestStatus,
    mode,
}: ValidateBidDraftArgs): string | null => {
    if (mode === "create" && !helpRequestId) {
        return "Unable to submit bid without a request id.";
    }

    const parsedAmount = parseBidAmountInput(amountInput);
    if (parsedAmount.error) {
        return parsedAmount.error;
    }

    const normalizedMessage = message.trim();
    if (normalizedMessage.length < BID_MESSAGE_MIN_LENGTH) {
        return `Message must be at least ${BID_MESSAGE_MIN_LENGTH} characters.`;
    }

    if (normalizedMessage.length > BID_MESSAGE_MAX_LENGTH) {
        return `Message must be ${BID_MESSAGE_MAX_LENGTH} characters or fewer.`;
    }

    if (requestStatus && requestStatus !== "OPEN") {
        return "Bidding is only available while a request is open.";
    }

    return null;
};

export const validateProfileUpdateForm = ({
    fullName,
    dateOfBirth,
    bio,
}: ValidateProfileUpdateArgs) => {
    const normalizedName = fullName.trim();

    if (!normalizedName) {
        return "Full name is required.";
    }

    if (normalizedName.length < PROFILE_FULL_NAME_MIN_LENGTH) {
        return `Full name must be at least ${PROFILE_FULL_NAME_MIN_LENGTH} characters.`;
    }

    if (normalizedName.length > PROFILE_FULL_NAME_MAX_LENGTH) {
        return `Full name must be ${PROFILE_FULL_NAME_MAX_LENGTH} characters or fewer.`;
    }

    if (dateOfBirth?.trim()) {
        const dateValidation = validateDateOfBirth(dateOfBirth);
        if (dateValidation) {
            return dateValidation;
        }
    }

    const normalizedBio = bio?.trim() ?? "";
    if (normalizedBio.length > PROFILE_BIO_MAX_LENGTH) {
        return `Bio must be ${PROFILE_BIO_MAX_LENGTH} characters or fewer.`;
    }

    return null;
};