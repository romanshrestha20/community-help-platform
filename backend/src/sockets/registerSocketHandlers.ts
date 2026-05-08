
import type { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";
import {
  markConversationMessagesAsRead,
  sendConversationMessage,
} from "../services/conversation.service.js";
import { verifyAccessToken, verifyRefreshToken } from "../utils/jwt.js";
import { hashToken } from "../utils/token.js";

type SocketUser = {
  userId: string;
  sessionId?: string;
};

type AuthedSocket = Socket & {
  data: {
    user?: SocketUser;
  };
};

const getTokenFromSocket = (socket: Socket) => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken;
  }

  const header = socket.handshake.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return null;
};

const getRefreshTokenFromSocket = (socket: Socket) => {
  const authRefreshToken = socket.handshake.auth?.refreshToken;
  if (typeof authRefreshToken === "string" && authRefreshToken.trim()) {
    return authRefreshToken;
  }
  return null;
};

export const registerSocketHandlers = (io: Server) => {
  io.use(async (socket: AuthedSocket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      console.log("[socket] auth attempt", {
        socketId: socket.id,
        hasToken: Boolean(token),
      });

      if (!token) {
        console.warn("[socket] auth failed: missing token", { socketId: socket.id });
        return next(new Error("Unauthorized"));
      }

      const decoded = verifyAccessToken(token) as { userId?: string };
      if (!decoded.userId) {
        console.warn("[socket] auth failed: missing userId in token", { socketId: socket.id });
        return next(new Error("Unauthorized"));
      }

      const refreshToken = getRefreshTokenFromSocket(socket);
      let sessionId: string | undefined;

      if (refreshToken) {
        try {
          const refreshPayload = verifyRefreshToken(refreshToken);
          if (refreshPayload.userId === decoded.userId) {
            const storedSession = await prisma.refreshToken.findUnique({
              where: { tokenHash: hashToken(refreshToken) },
              select: { id: true, userId: true },
            });

            if (storedSession?.userId === decoded.userId) {
              sessionId = storedSession.id;
            }
          }
        } catch {
          // Ignore refresh-token errors for socket auth; access token is still authoritative.
        }
      }

      socket.data.user = { userId: decoded.userId, sessionId };
      console.log("[socket] auth success", {
        socketId: socket.id,
        userId: decoded.userId,
        sessionId: sessionId ?? null,
      });
      next();
    } catch (error) {
      console.warn("[socket] auth failed: jwt verify error", {
        socketId: socket.id,
        error: error instanceof Error ? error.message : "unknown",
      });
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket: AuthedSocket) => {
    const userId = socket.data.user?.userId;
    if (!userId) {
      console.warn("[socket] connection rejected: missing authed user", { socketId: socket.id });
      socket.disconnect();
      return;
    }

    console.log("[socket] connected", {
      socketId: socket.id,
      userId,
    });

    socket.join(`user:${userId}`);
    const sessionId = socket.data.user?.sessionId;
    if (sessionId) {
      socket.join(`session:${sessionId}`);
    }

    socket.on("conversation:join", async ({ conversationId }, ack) => {
      try {
        console.log("[socket] conversation:join attempt", {
          socketId: socket.id,
          userId,
          conversationId,
        });

        const member = await prisma.conversationMember.findFirst({
          where: {
            conversationId,
            userId,
          },
        });

        if (!member) {
          console.warn("[socket] conversation:join forbidden", {
            socketId: socket.id,
            userId,
            conversationId,
          });
          return ack?.({ ok: false, error: "Forbidden" });
        }

        socket.join(`conversation:${conversationId}`);
        console.log("[socket] conversation:join success", {
          socketId: socket.id,
          userId,
          conversationId,
        });
        ack?.({ ok: true });
      } catch (error) {
        console.warn("[socket] conversation:join failed", {
          socketId: socket.id,
          userId,
          conversationId,
          error: error instanceof Error ? error.message : "unknown",
        });
        ack?.({ ok: false, error: "Failed to join conversation" });
      }
    });

    socket.on("conversation:leave", ({ conversationId }, ack) => {
      socket.leave(`conversation:${conversationId}`);
      ack?.({ ok: true });
    });

    socket.on("message:send", async (payload, ack) => {
      try {
        const { conversationId, content } = payload ?? {};
        console.log("[socket] message:send attempt", {
          socketId: socket.id,
          userId,
          conversationId,
          contentLength: typeof content === "string" ? content.trim().length : null,
        });

        if (!conversationId || typeof content !== "string" || !content.trim()) {
          console.warn("[socket] message:send invalid payload", {
            socketId: socket.id,
            userId,
            conversationId,
          });
          return ack?.({ ok: false, error: "Invalid payload" });
        }

        const message = await sendConversationMessage({
          conversationId,
          senderId: userId,
          content,
        });

        io.to(`conversation:${conversationId}`).emit("message:new", {
          conversationId,
          message,
        });

        console.log("[socket] message:send success", {
          socketId: socket.id,
          userId,
          conversationId,
          messageId: message.id,
        });
        ack?.({ ok: true, message });
      } catch (error) {
        console.warn("[socket] message:send failed", {
          socketId: socket.id,
          userId,
          error: error instanceof Error ? error.message : "unknown",
        });
        ack?.({
          ok: false,
          error: error instanceof Error ? error.message : "Failed to send message",
        });
      }
    });

    socket.on("message:read", async ({ conversationId }, ack) => {
      try {
        if (!conversationId || typeof conversationId !== "string") {
          return ack?.({ ok: false, error: "Invalid payload" });
        }

        await markConversationMessagesAsRead(conversationId, userId);

        socket.to(`conversation:${conversationId}`).emit("message:read", {
          conversationId,
          userId,
          isRead: true,
          readAt: new Date().toISOString(),
        });

        ack?.({ ok: true });
      } catch (error) {
        ack?.({
          ok: false,
          error: error instanceof Error ? error.message : "Failed to mark as read",
        });
      }
    });

    socket.on("typing:start", async ({ conversationId }) => {
      const member = await prisma.conversationMember.findFirst({
        where: { conversationId, userId },
      });

      if (!member) return;

      socket.to(`conversation:${conversationId}`).emit("typing:start", {
        conversationId,
        userId,
      });
    });

    socket.on("typing:stop", async ({ conversationId }) => {
      const member = await prisma.conversationMember.findFirst({
        where: { conversationId, userId },
      });

      if (!member) return;

      socket.to(`conversation:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId,
      });
    });

    socket.on("disconnect", () => {
      console.log("[socket] disconnected", {
        socketId: socket.id,
        userId,
      });
    });
  });
};
