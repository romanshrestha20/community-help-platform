type AddressLike = {
    addressLine1?: string | null;
    addressLine2?: string | null;
    postalCode?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    formattedAddress?: string | null;
};

const normalizeStreetLine = (value?: string | null) => {
    const line = value?.trim();
    if (!line) return "";

    // Convert "2 Jalsitie" -> "Jalsitie 2" for better readability.
    const leadingNumberMatch = line.match(/^(\d+[a-zA-Z]?)\s+(.+)$/);
    if (leadingNumberMatch) {
        const [, number, street] = leadingNumberMatch;
        return `${street} ${number}`.trim();
    }

    return line;
};

const buildStreetLabel = (address?: AddressLike | null) => {
    if (!address) return "";

    const line1 = normalizeStreetLine(address.addressLine1);
    const line2 = address.addressLine2?.trim() || "";

    if (line1 && line2) {
        return `${line1} ${line2}`.trim();
    }

    if (line1) {
        return line1;
    }

    // Fallback to formattedAddress first segment only when line1 is unavailable.
    return (
        address.formattedAddress
            ?.split(",")
            .map((segment) => segment.trim())
            .filter(Boolean)[0] || ""
    );
};

export const formatCompactAddress = (
    address?: AddressLike | null,
    fallback = "N/A"
) => {
    if (!address) return fallback;

    const primaryStreet = buildStreetLabel(address);

    const preferredParts = [primaryStreet, address.postalCode, address.city]
        .map((part) => part?.trim())
        .filter(Boolean) as string[];

    if (preferredParts.length > 0) {
        return preferredParts.join(", ");
    }

    const regionParts = [address.state, address.country]
        .map((part) => part?.trim())
        .filter(Boolean) as string[];

    if (regionParts.length > 0) {
        return regionParts.join(", ");
    }

    if (address.formattedAddress?.trim()) {
        return address.formattedAddress
            .split(",")
            .slice(0, 2)
            .join(",")
            .trim();
    }

    return fallback;
};

export const shortenPlainAddress = (value?: string | null, fallback = "N/A") => {
    const trimmed = value?.trim();
    if (!trimmed) return fallback;

    if (!trimmed.includes(",")) {
        return trimmed;
    }

    return trimmed
        .split(",")
        .slice(0, 2)
        .join(",")
        .trim();
};
