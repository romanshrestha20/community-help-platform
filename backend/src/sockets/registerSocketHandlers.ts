
import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import {
  markConversationMessagesAsRead,
  sendConversationMessage,
} from "../services/conversation.service.js";

type SocketUser = {
  userId: string;
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

export const registerSocketHandlers = (io: Server) => {
  io.use((socket: AuthedSocket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
      socket.data.user = { userId: decoded.sub };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket: AuthedSocket) => {
    const userId = socket.data.user?.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.join(`user:${userId}`);

    socket.on("conversation:join", async ({ conversationId }, ack) => {
      try {
        const member = await prisma.conversationMember.findFirst({
          where: {
            conversationId,
            userId,
          },
        });

        if (!member) {
          return ack?.({ ok: false, error: "Forbidden" });
        }

        socket.join(`conversation:${conversationId}`);
        ack?.({ ok: true });
      } catch {
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

        if (!conversationId || typeof content !== "string" || !content.trim()) {
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

        ack?.({ ok: true, message });
      } catch (error) {
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
      // optional: emit user offline
    });
  });
};
