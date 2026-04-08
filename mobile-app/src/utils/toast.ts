import Toast, { ToastShowParams } from "react-native-toast-message";
import { spacing } from "@/design-system";
import { setToastStyleOverrides, ToastStyleOverrides } from "@/utils/toastConfig";

export type ToastType = "success" | "error" | "info";

export interface ToastOptions {
  duration?: number;
  position?: "top" | "bottom";
  onPress?: () => void;
  showIcon?: boolean;
  iconLabel?: string;
  dismissOnPress?: boolean;
}

const TOAST_TIME_UNIT_MS = 250;
const DEFAULT_TOAST_DURATION = spacing.sm * TOAST_TIME_UNIT_MS;
const ERROR_TOAST_DURATION = spacing.md * TOAST_TIME_UNIT_MS;
const TOAST_TOP_OFFSET = spacing.xxl + spacing.lg;
const TOAST_BOTTOM_OFFSET = spacing.xxl + spacing.xs;

export interface ToastGlobalOptions {
  position?: "top" | "bottom";
  duration?: number;
  errorDuration?: number;
  topOffset?: number;
  bottomOffset?: number;
  styleOverrides?: ToastStyleOverrides;
}

const toastDefaults: Required<Omit<ToastGlobalOptions, "styleOverrides">> = {
  position: "top",
  duration: DEFAULT_TOAST_DURATION,
  errorDuration: ERROR_TOAST_DURATION,
  topOffset: TOAST_TOP_OFFSET,
  bottomOffset: TOAST_BOTTOM_OFFSET,
};

export const configureToast = (options: ToastGlobalOptions) => {
  if (typeof options.position === "string") {
    toastDefaults.position = options.position;
  }

  if (typeof options.duration === "number") {
    toastDefaults.duration = options.duration;
  }

  if (typeof options.errorDuration === "number") {
    toastDefaults.errorDuration = options.errorDuration;
  }

  if (typeof options.topOffset === "number") {
    toastDefaults.topOffset = options.topOffset;
  }

  if (typeof options.bottomOffset === "number") {
    toastDefaults.bottomOffset = options.bottomOffset;
  }

  setToastStyleOverrides(options.styleOverrides);
};

/**
 * Global toast notification utility
 * 
 * @example
 * showToast("success", "Saved successfully");
 * showToast("error", "Upload failed", "Please try again");
 * showToast("info", "Processing...", undefined, { duration: 5000 });
 */
export const showToast = (
  type: ToastType,
  title: string,
  message?: string | null,
  options?: ToastOptions
): void => {
  if (!title || !title.trim()) return;

  const dismissOnPress = options?.dismissOnPress ?? true;

  const config: ToastShowParams = {
    type,
    text1: title,
    text2: message || undefined,
    position: options?.position || toastDefaults.position,
    visibilityTime: options?.duration || toastDefaults.duration,
    autoHide: true,
    topOffset: toastDefaults.topOffset,
    bottomOffset: toastDefaults.bottomOffset,
    props: {
      showIcon: options?.showIcon ?? true,
      iconLabel: options?.iconLabel,
    },
    onPress: () => {
      if (dismissOnPress) {
        Toast.hide();
      }
      options?.onPress?.();
    },
  };

  Toast.show(config);
};

/**
 * Show success toast (green, auto-dismiss after 3s)
 */
export const showSuccessToast = (
  title: string,
  message?: string,
  options?: ToastOptions
): void => {
  showToast("success", title, message, options);
};

/**
 * Show error toast (red, auto-dismiss after 4s)
 */
export const showErrorToast = (
  title: string,
  message?: string,
  options?: ToastOptions
): void => {
  showToast("error", title, message, {
    ...options,
    duration: options?.duration || toastDefaults.errorDuration,
  });
};

/**
 * Show info toast (blue, auto-dismiss after 3s)
 */
export const showInfoToast = (
  title: string,
  message?: string,
  options?: ToastOptions
): void => {
  showToast("info", title, message, options);
};