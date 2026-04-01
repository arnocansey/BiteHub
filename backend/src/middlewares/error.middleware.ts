import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (env.nodeEnv !== "production") {
    console.error(error);
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};
