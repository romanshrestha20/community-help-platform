import { Platform } from "react-native";

type BiometricModule = {
  hasHardwareAsync: () => Promise<boolean>;
  isEnrolledAsync: () => Promise<boolean>;
  authenticateAsync: (options?: {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
};

const loadBiometricModule = async (): Promise<BiometricModule | null> => {
  try {
    const moduleName = "expo-local-authentication";
    const imported = await import(moduleName);
    return imported as BiometricModule;
  } catch {
    return null;
  }
};

export const confirmSensitiveAction = async (promptMessage: string) => {
  if (Platform.OS === "web") {
    return true;
  }

  const localAuth = await loadBiometricModule();
  if (!localAuth) {
    return true;
  }

  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      localAuth.hasHardwareAsync(),
      localAuth.isEnrolledAsync(),
    ]);

    if (!hasHardware || !isEnrolled) {
      return true;
    }

    const result = await localAuth.authenticateAsync({
      promptMessage,
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    return result.success === true;
  } catch {
    return false;
  }
};
