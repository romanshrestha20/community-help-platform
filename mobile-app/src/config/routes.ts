
// Centralized route definitions for the app

export const APP_ROUTES = {
    HOME: "/home",
    HOME_REQUESTS: "/home/requests",
    HOME_REQUEST_DETAILS: (id: string) => `/home/requests/${id}`,
    HOME_REQUEST_EDIT: (id: string) => `/home/requests/${id}/edit`,
    PROFILE: "/profile",
    PROFILE_REQUESTS: "/profile/requests",
    PROFILE_BIDS: "/profile/bids",
    PROFILE_REQUEST_DETAILS: (id: string) => `/profile/requests/${id}`,
    PROFILE_REQUEST_EDIT: (id: string) => `/profile/requests/${id}/edit`,
    AUTH_LOGIN: "/(auth)/login",
    AUTH_REGISTER: "/(auth)/register",

} as const;
