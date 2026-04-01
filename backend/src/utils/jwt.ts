import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { JwtPayload } from "../types/auth";

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessTtl as SignOptions["expiresIn"]
  });

export const signRefreshToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshTtl as SignOptions["expiresIn"]
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.jwtAccessSecret) as JwtPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
