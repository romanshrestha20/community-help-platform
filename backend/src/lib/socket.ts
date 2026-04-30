import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server | null = null;
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";
const defaultDevOrigins = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:3000",
];
const effectiveOrigins = allowedOrigins.length > 0 ? allowedOrigins : (isProduction ? [] : defaultDevOrigins);

// Initializes the Socket.IO server 
// and attaches it to the provided HTTP server
export const initSocketServer = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: effectiveOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  return io;
};

// Retrieves the initialized Socket.IO server instance
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};
