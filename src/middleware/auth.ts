import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "./errors.js";

export interface AuthedRequest extends Request {
  userId?: string;
}

export const jwtSecret = () => process.env.JWT_SECRET ?? "dev-only-secret-change-me";

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, jwtSecret(), { expiresIn: "8h" });
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "missing bearer token"));
  try {
    const payload = jwt.verify(token, jwtSecret()) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, "invalid or expired token"));
  }
}
