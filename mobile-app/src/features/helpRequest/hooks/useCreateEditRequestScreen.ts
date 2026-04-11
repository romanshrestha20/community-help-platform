import { useEffect, useMemo, useState } from "react";

import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { AppLocation } from "@/features/location/types/location.types";
import { useHelpRequest } from "./helpRequest.hook";
import {
    CreateHelpRequestData,
    HelpRequest,
    RequestImageUploadInput,
    UpdateHelpRequestData,
} from "../types/helpRequest.types";
import {
    parseBudgetInput,
    validateRequestDraftFields,
} from "../utils/requestValidation";

export type RequestFormState = {
    title: string;
    description: string;
    category: CreateHelpRequestData["category"];
    budget: string;
    city: string;
    country: string;
};

type Options = {
    requestId?: string;
};

const DEFAULT_FORM: RequestFormState = {
    title: "",
    description: "",
    category: "FOOD",
    budget: "",
    city: "",
    country: "",
};

const toRequestLocation = (request: HelpRequest): AppLocation | null => {
    if (request.location) return request.location;

    if (!request.city && !request.country) return null;

    return {
        latitude: 0,
        longitude: 0,
        addressLine1: null,
        addressLine2: null,
        city: request.city ?? null,
        state: null,
        postalCode: null,
        country: request.country ?? null,
        formattedAddress: [request.city, request.country].filter(Boolean).join(", "),
    };
};

export const useCreateEditRequestScreen = ({ requestId }: Options = {}) => {
    const {
        loading: requestLoading,
        error: requestError,
        getHelpRequestById,
        createHelpRequest,
        updateHelpRequest,
        addHelpRequestImages,
    } = useHelpRequest();

    const locationPicker = useLocationPicker({
        autoUseCurrentLocationOnMount: false,
    });
    const { setValue: setLocationValue } = locationPicker;

    const [request, setRequest] = useState<HelpRequest | null>(null);
    const [loadingRequest, setLoadingRequest] = useState(Boolean(requestId));
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<"title" | "description" | "budget" | "location", string>>
    >({});
    const [form, setForm] = useState<RequestFormState>(DEFAULT_FORM);

    const isEditing = Boolean(requestId);

    useEffect(() => {
        if (!requestId) {
            setForm(DEFAULT_FORM);
            setRequest(null);
            return;
        }

        let isMounted = true;

        const loadRequest = async () => {
            setLoadingRequest(true);
            const loaded = await getHelpRequestById(requestId);

            if (!isMounted || !loaded) {
                setLoadingRequest(false);
                return;
            }

            setRequest(loaded);
            setForm({
                title: loaded.title,
                description: loaded.description,
                category: loaded.category,
                budget: typeof loaded.budget === "number" ? String(loaded.budget) : "",
                city: loaded.city ?? loaded.location?.city ?? "",
                country: loaded.country ?? loaded.location?.country ?? "",
            });

            await setLocationValue(toRequestLocation(loaded));
            setLoadingRequest(false);
        };

        void loadRequest();

        return () => {
            isMounted = false;
        };
    }, [getHelpRequestById, requestId, setLocationValue]);

    const budgetValue = useMemo(() => {
        const parsed = parseBudgetInput(form.budget);
        return parsed.amount;
    }, [form.budget]);

    const updateField = <K extends keyof RequestFormState>(field: K, value: RequestFormState[K]) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setValidationError(null);
        if (field === "title" || field === "description" || field === "budget") {
            setFieldErrors((prev) => {
                const typedField = field as keyof typeof prev;
                if (!prev[typedField]) return prev;
                const { [typedField]: _removed, ...rest } = prev;
                return rest;
            });
        }
    };

    const clearFieldError = (field: "title" | "description" | "budget" | "location") => {
        setFieldErrors((prev) => {
            if (!prev[field]) return prev;
            const { [field]: _removed, ...rest } = prev;
            return rest;
        });
    };

    const submitRequest = async (selectedImages: RequestImageUploadInput[] = []) => {
        const validation = validateRequestDraftFields({
            title: form.title,
            description: form.description,
            budgetInput: form.budget,
            location: locationPicker.value,
        });

        if (!validation.isValid) {
            setValidationError(validation.formError);
            setFieldErrors(validation.fieldErrors);
            return null;
        }

        setSaving(true);
        setValidationError(null);
        setFieldErrors({});

        try {
            const location = locationPicker.value;

            if (!location) {
                // Already validated above; this guards against stale state between validation and submit.
                return null;
            }

            const payloadBase = {
                title: form.title.trim(),
                description: form.description.trim(),
                category: form.category,
                budget: budgetValue,
                isPaid: Boolean(budgetValue),
                city: location.city ?? (form.city.trim() || undefined),
                country: location.country ?? (form.country.trim() || undefined),
            };

            if (requestId) {
                const payload: UpdateHelpRequestData = {
                    ...payloadBase,
                    location,
                };

                const updated = await updateHelpRequest(requestId, payload);

                if (updated && selectedImages.length > 0) {
                    await addHelpRequestImages(requestId, selectedImages);
                }

                return updated;
            }

            const createPayload: CreateHelpRequestData = {
                ...payloadBase,
                location,
            };

            const created = await createHelpRequest(createPayload, selectedImages);

            if (created && selectedImages.length > 0) {
                const refreshed = await getHelpRequestById(created.id);
                if (refreshed?.images?.length) {
                    return refreshed;
                }

                if (refreshed) {
                    await addHelpRequestImages(created.id, selectedImages);
                    const withImages = await getHelpRequestById(created.id);
                    return withImages ?? created;
                }
            }

            return created;
        } finally {
            setSaving(false);
        }
    };

    return {
        request,
        isEditing,
        form,
        loadingRequest: loadingRequest || requestLoading,
        saving,
        validationError,
        fieldErrors,
        requestError,
        locationPicker,
        updateField,
        clearFieldError,
        setValidationError,
        submitRequest,
    };
};
