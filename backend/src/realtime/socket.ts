import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env";

let io: Server | null = null;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: [env.adminDashboardUrl, env.clientAppUrl]
    }
  });

  io.on("connection", (socket) => {
    socket.on("order:join", (orderId: string) => socket.join(`order:${orderId}`));
    socket.on("vendor:join", (vendorId: string) => socket.join(`vendor:${vendorId}`));
    socket.on("rider:join", (riderId: string) => socket.join(`rider:${riderId}`));
  });

  return io;
};

export const emitOrderUpdate = (orderId: string, payload: unknown) => {
  io?.to(`order:${orderId}`).emit("order:update", payload);
};

