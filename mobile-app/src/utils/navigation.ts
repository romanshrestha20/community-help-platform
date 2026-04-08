import { Href, router } from "expo-router";
import { APP_ROUTES } from "@/config/routes";

type BackNavigationOptions = {
    fallback?: Href;
    replace?: boolean;
};

export const goBackOrFallback = ({
    fallback = APP_ROUTES.HOME,
    replace = true,
}: BackNavigationOptions = {}) => {
    if (router.canGoBack()) {
        router.back();
        return;
    }

    if (replace) {
        router.replace(fallback);
        return;
    }

    router.push(fallback);
};

export const navigateTo = (href: Href) => {
    router.push(href);
};

export const replaceTo = (href: Href) => {
    router.replace(href);
};