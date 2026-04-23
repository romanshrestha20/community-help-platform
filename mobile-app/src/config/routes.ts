
// Centralized route definitions for the app

export const APP_ROUTES = {
    HOME: "/home",
    HOME_REQUESTS: "/home/requests",
    HOME_REQUESTS_MAP: "/home/requests/map",
    HOME_REQUEST_DETAILS: (id: string) => `/home/requests/${id}`,
    HOME_REQUEST_EDIT: (id: string) => `/home/requests/${id}/edit`,
    FAVORITES: "/favorites",
    FAVORITES_REQUEST_DETAILS: (id: string) => `/favorites/requests/${id}`,
    PROFILE: "/profile",
    PROFILE_NOTIFICATIONS: "/profile/notifications",
    PROFILE_PRIVACY: "/profile/security",
    PROFILE_SUPPORT: "/profile/support",
    PROFILE_REQUESTS: "/profile/requests",
    PROFILE_BIDS: "/profile/bids",
    PROFILE_REQUEST_DETAILS: (id: string) => `/profile/requests/${id}`,
    PROFILE_REQUEST_EDIT: (id: string) => `/profile/requests/${id}/edit`,
    AUTH_LOGIN: "/(auth)/login",
    AUTH_REGISTER: "/(auth)/register",
    AUTH_FORGOT_PASSWORD: "/(auth)/forgot-password",
    AUTH_RESET_PASSWORD: "/(auth)/reset-password",
    AUTH_VERIFY_EMAIL: "/(auth)/verify-email",
    AUTH_VERIFY_PHONE: "/(auth)/verify-phone",
    AUTH_WELCOME: "/(auth)/welcome",
    LOCATION_PICKER: "/location/picker",
} as const;
