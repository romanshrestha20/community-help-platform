import { Platform } from "react-native";
import Constants from "expo-constants";
import { io, type Socket } from "socket.io-client";

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

type TypingEvent = {
  conversationId: string;
  userId: string;
};

let socket: Socket | null = null;
const SOCKET_ACK_TIMEOUT_MS = 4000;
const SOCKET_CONNECT_TIMEOUT_MS = 5000;

const resolveSocketBaseUrl = () => {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const isNative = Platform.OS === "ios" || Platform.OS === "android";
  const isLocalhostEnv =
    typeof envBaseUrl === "string" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(envBaseUrl);

  if (envBaseUrl && !(isNative && isLocalhostEnv)) {
    return envBaseUrl.replace(/\/api\/?$/, "");
  }

  if (envBaseUrl && isNative && isLocalhostEnv) {
    console.warn(
      "[socket-client] Ignoring EXPO_PUBLIC_API_BASE_URL pointing to localhost on native device."
    );
  }

  if (__DEV__) {
    if (Platform.OS === "web") {
      const host =
        typeof window !== "undefined" ? window.location.hostname : "localhost";
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
  }

  if (isNative) {
    console.warn(
      "[socket-client] No reachable dev host detected for native runtime. Falling back to production socket host."
    );
  }

  return "https://community-help-platform.onrender.com";
};

const SOCKET_BASE_URL = resolveSocketBaseUrl();
console.log("[socket-client] base URL:", SOCKET_BASE_URL);

const ensureSocketInstance = () => {
  if (!socket) {
    socket = io(SOCKET_BASE_URL, {
      autoConnect: false,
      transports: ["websocket"],
      timeout: SOCKET_CONNECT_TIMEOUT_MS,
      withCredentials: true,
      auth: {},
    });
  }

  return socket;
};

const emitAck = <T>(targetSocket: Socket, event: string, payload?: unknown) =>
  new Promise<AckResponse<T>>((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        ok: false,
        error: `Socket ${event} timed out`,
      } as AckResponse<T>);
    }, SOCKET_ACK_TIMEOUT_MS);

    targetSocket.emit(event, payload, (response: AckResponse<T>) => {
      clearTimeout(timeoutId);
      resolve(response);
    });
  });

export const connectSocket = async () => {
  const targetSocket = ensureSocketInstance();
  const token = await getAccessToken();

  if (!token) {
    throw new Error("Missing access token for socket connection");
  }

  targetSocket.auth = { token };

  if (targetSocket.connected) {
    return targetSocket;
  }

  return new Promise<Socket>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeoutId);
      targetSocket.off("connect", handleConnect);
      targetSocket.off("connect_error", handleConnectError);
    };

    const handleConnect = () => {
      console.log("[socket-client] connected", {
        socketId: targetSocket.id,
      });
      cleanup();
      resolve(targetSocket);
    };

    const handleConnectError = (error: Error) => {
      console.warn("[socket-client] connect_error", {
        message: error.message,
      });
      cleanup();
      reject(error);
    };

    const timeoutId = setTimeout(() => {
      console.warn("[socket-client] connect timeout");
      cleanup();
      reject(new Error("Socket connection timed out"));
    }, SOCKET_CONNECT_TIMEOUT_MS);

    targetSocket.once("connect", handleConnect);
    targetSocket.once("connect_error", handleConnectError);
    targetSocket.connect();
  });
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

export const getSocket = () => socket;

export const reconnectSocketWithFreshToken = async () => {
  const token = await getAccessToken();

  if (!socket || !token) {
    return;
  }

  socket.auth = { token };

  if (socket.connected) {
    socket.disconnect();
  }

  socket.connect();
};

export const joinConversationRoom = async (conversationId: string) => {
  const targetSocket = await connectSocket();
  console.log("[socket-client] joining conversation", { conversationId });

  const response = await emitAck(targetSocket, "conversation:join", {
    conversationId,
  });

  console.log("[socket-client] join ack", { conversationId, response });

  if (!response.ok) {
    throw new Error(response.error || "Failed to join conversation");
  }
};

export const leaveConversationRoom = async (conversationId: string) => {
  const targetSocket = await connectSocket();
  const response = await emitAck(targetSocket, "conversation:leave", {
    conversationId,
  });

  if (!response.ok) {
    throw new Error(response.error || "Failed to leave conversation");
  }
};

export const sendSocketMessage = async <TMessage>(
  conversationId: string,
  content: string
) => {
  const targetSocket = await connectSocket();

  console.log("[socket-client] message:send emit", {
    conversationId,
    contentLength: content.trim().length,
  });

  const response = await emitAck<{ message: TMessage }>(
    targetSocket,
    "message:send",
    {
      conversationId,
      content,
    }
  );

  console.log("[socket-client] message:send ack", {
    conversationId,
    response,
  });

  if (!response.ok || !response.message) {
    throw new Error(response.error || "Failed to send message");
  }

  return response.message;
};

export const markSocketConversationRead = async (conversationId: string) => {
  const targetSocket = await connectSocket();

  console.log("[socket-client] message:read emit", { conversationId });

  const response = await emitAck(targetSocket, "message:read", {
    conversationId,
  });

  console.log("[socket-client] message:read ack", { conversationId, response });

  if (!response.ok) {
    throw new Error(response.error || "Failed to mark conversation as read");
  }
};

export const startSocketTyping = async (conversationId: string) => {
  const targetSocket = await connectSocket();
  targetSocket.emit("typing:start", { conversationId });
};

export const stopSocketTyping = async (conversationId: string) => {
  const targetSocket = await connectSocket();
  targetSocket.emit("typing:stop", { conversationId });
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
export type SocketTypingEvent = TypingEvent;
