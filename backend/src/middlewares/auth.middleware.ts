import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../generated/prisma/client";
import { verifyAccessToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        role: UserRole;
        email: string;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    req.user = verifyAccessToken(header.replace("Bearer ", ""));
    next();
  } catch {
    return res.status(401).json({ message: "Your session is invalid or has expired. Please sign in again." });
  }
};

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have access to this resource"
      });
    }

    next();
  };
