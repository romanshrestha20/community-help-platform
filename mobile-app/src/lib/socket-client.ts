import { Platform } from "react-native";
import Constants from "expo-constants";
import { io, type Socket } from "socket.io-client";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { getAccessToken } from "@/utils/token";

type AckResponse<T = unknown> = {
  ok: boolean;
  error?: string;
} & T;

type MessageReadEvent = {
  conversationId: string;
  userId: string;
  isRead?: boolean;
  readAt?: string;
};

let socket: Socket | null = null;

const resolveSocketBaseUrl = () => {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/api\/?$/, "");
  }

  if (Platform.OS === "web") {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `http://${host}:5001`;
  }

  const constants = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };

  const hostFromExpo = [
    constants.expoConfig?.hostUri,
    constants.expoGoConfig?.debuggerHost,
    constants.manifest?.debuggerHost,
    constants.manifest2?.extra?.expoClient?.hostUri,
  ]
    .find((value) => typeof value === "string" && value.length > 0)
    ?.split(":")[0];

  if (hostFromExpo) {
    return `http://${hostFromExpo}:5001`;
  }

  if (Platform.OS === "ios") return "http://localhost:5001";
  if (Platform.OS === "android") return "http://10.0.2.2:5001";

  return "http://localhost:5001";
};

const SOCKET_BASE_URL = resolveSocketBaseUrl();

const ensureSocketInstance = () => {
  if (!socket) {
    socket = io(SOCKET_BASE_URL, {
      autoConnect: false,
      transports: ["websocket"],
    });
  }

  return socket;
};

const emitAck = <T>(targetSocket: Socket, event: string, payload?: unknown) =>
  new Promise<AckResponse<T>>((resolve) => {
    targetSocket.emit(event, payload, (response: AckResponse<T>) => {
      resolve(response);
    });
  });

export const connectSocket = async () => {
  const targetSocket = ensureSocketInstance();
  const token =
    useAuthStore.getState().accessToken ||
    (await getAccessToken());

  if (!token) {
    throw new Error("Missing access token for socket connection");
  }

  targetSocket.auth = { token };

  if (!targetSocket.connected) {
    targetSocket.connect();
  }

  return targetSocket;
};

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.disconnect();
};

export const getSocket = () => socket;

export const joinConversationRoom = async (conversationId: string) => {
  const targetSocket = await connectSocket();
  const response = await emitAck(targetSocket, "conversation:join", { conversationId });

  if (!response.ok) {
    throw new Error(response.error || "Failed to join conversation");
  }
};

export const leaveConversationRoom = async (conversationId: string) => {
  const targetSocket = await connectSocket();
  const response = await emitAck(targetSocket, "conversation:leave", { conversationId });

  if (!response.ok) {
    throw new Error(response.error || "Failed to leave conversation");
  }
};

export const sendSocketMessage = async <TMessage>(
  conversationId: string,
  content: string
) => {
  const targetSocket = await connectSocket();
  const response = await emitAck<{ message: TMessage }>(targetSocket, "message:send", {
    conversationId,
    content,
  });

  if (!response.ok || !response.message) {
    throw new Error(response.error || "Failed to send message");
  }

  return response.message;
};

export const markSocketConversationRead = async (conversationId: string) => {
  const targetSocket = await connectSocket();
  const response = await emitAck(targetSocket, "message:read", { conversationId });

  if (!response.ok) {
    throw new Error(response.error || "Failed to mark conversation as read");
  }
};

export const addSocketListener = <T>(
  event: string,
  listener: (payload: T) => void
) => {
  const targetSocket = ensureSocketInstance();
  targetSocket.on(event, listener);

  return () => {
    targetSocket.off(event, listener);
  };
};

export type SocketMessageReadEvent = MessageReadEvent;
