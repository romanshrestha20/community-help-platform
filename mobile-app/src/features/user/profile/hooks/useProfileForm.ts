import { useEffect, useState } from "react";

import { Gender, UpdateUserProfilePayload, User, UserType } from "@/features/user/types/user.types";

const buildFormFromUser = (user: User | null): UpdateUserProfilePayload => {
    if (!user) {
        return {};
    }

    return {
        fullName: user.fullName,
        bio: user.bio ?? "",
        dateOfBirth: user.dateOfBirth ?? "",
        gender: user.gender ?? undefined,
        userType: user.userType,
        address: user.address ?? null,
    };
};

export const useProfileForm = (user: User | null) => {
    const [form, setForm] = useState<UpdateUserProfilePayload>({});
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        setForm(buildFormFromUser(user));
    }, [user]);

    const updateField = <K extends keyof UpdateUserProfilePayload>(
        field: K,
        value: UpdateUserProfilePayload[K]
    ) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (_event: unknown, selectedDate?: Date) => {
        setShowDatePicker(false);

        if (selectedDate) {
            updateField("dateOfBirth", selectedDate.toISOString().split("T")[0]);
        }
    };

    const setFullName = (value: string) => updateField("fullName", value);
    const setBio = (value: string) => updateField("bio", value);
    const setGender = (value: Gender) => updateField("gender", value);
    const setUserType = (value: UserType) => updateField("userType", value);
    const resetForm = () => {
        setShowDatePicker(false);
        setForm(buildFormFromUser(user));
    };

    return {
        form,
        showDatePicker,
        setShowDatePicker,
        handleDateChange,
        setFullName,
        setBio,
        setGender,
        setUserType,
        resetForm,
    };
};
