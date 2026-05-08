import { useAuthStore } from "../store/auth.store";
import { clearTokens } from "@/utils/token";
import { disconnectSocket } from "@/lib/socket-client";

export const performClientLogout = async () => {
  await clearTokens();
  disconnectSocket();
  useAuthStore.getState().logout();
};

