import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server | null = null;

// Initializes the Socket.IO server 
// and attaches it to the provided HTTP server
export const initSocketServer = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
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