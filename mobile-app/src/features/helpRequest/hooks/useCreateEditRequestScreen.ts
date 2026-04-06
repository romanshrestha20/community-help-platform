import { useEffect, useMemo, useState } from "react";

import { useLocationPicker } from "@/features/location/hooks/useLocationPicker";
import { AppLocation } from "@/features/location/types/location.types";
import { useHelpRequest } from "./helpRequest.hook";
import {
    CreateHelpRequestData,
    HelpRequest,
    UpdateHelpRequestData,
} from "../types/helpRequest.types";
import {
    parseBudgetInput,
    validateRequestDraft,
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
    } = useHelpRequest();

    const locationPicker = useLocationPicker({
        autoUseCurrentLocationOnMount: false,
    });
    const { setValue: setLocationValue } = locationPicker;

    const [request, setRequest] = useState<HelpRequest | null>(null);
    const [loadingRequest, setLoadingRequest] = useState(Boolean(requestId));
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
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
        return parsed.budget;
    }, [form.budget]);

    const updateField = <K extends keyof RequestFormState>(field: K, value: RequestFormState[K]) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setValidationError(null);
    };

    const submitRequest = async () => {
        const validation = validateRequestDraft({
            title: form.title,
            description: form.description,
            budgetInput: form.budget,
            location: locationPicker.value,
        });

        if (validation) {
            setValidationError(validation);
            return null;
        }

        setSaving(true);
        setValidationError(null);

        try {
            const location = locationPicker.value;

            if (!location) {
                setValidationError("Please choose a location.");
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
                return await updateHelpRequest(requestId, payload);
            }

            const createPayload: CreateHelpRequestData = {
                ...payloadBase,
                location,
            };

            return await createHelpRequest(createPayload);
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
        requestError,
        locationPicker,
        updateField,
        setValidationError,
        submitRequest,
    };
};
