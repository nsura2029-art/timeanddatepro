// src/admin/auth.ts
// JWT-cookie based admin auth. Cookie name: tdp_admin_session.
// On login:  verify bcrypt, sign JWT (HS256, 7-day TTL), set httpOnly cookie.
// On request: parse cookie, verify JWT, attach req.user = { id, username, role }.

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import type { Request, Response, NextFunction, RequestHandler } from "express";

const SECRET = process.env.JWT_SECRET || "tdp-dev-secret-change-me-in-prod";
const COOKIE_NAME = "tdp_admin_session";
const COOKIE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AdminSession {
  id: number;
  username: string;
  role: "admin" | "viewer";
}

export interface AuthedRequest extends Request {
  user?: AdminSession;
}

/** Verify password against stored bcrypt hash. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Hash a password for storing. */
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

/** Sign a JWT for the given user. */
export function signSession(user: AdminSession): string {
  return jwt.sign(user, SECRET, { expiresIn: "7d" });
}

/** Verify a JWT (or return null) */
export function verifySession(token: string): AdminSession | null {
  try {
    const decoded = jwt.verify(token, SECRET) as AdminSession;
    if (!decoded.id || !decoded.username) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Express middleware. Reads cookie + bearer header. */
export const loadSession: RequestHandler = (req, res, next) => {
  const authReq = req as AuthedRequest;
  let token: string | null = null;
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }
  }
  if (token) {
    const session = verifySession(token);
    if (session) authReq.user = session;
  }
  // Stage a setter for /login to use
  (res as any).__setSession = (user: AdminSession) => {
    const t = signSession(user);
    res.cookie(COOKIE_NAME, t, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_TTL_MS,
      path: "/",
    });
  };
  (res as any).__clearSession = () => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
  };
  next();
};

/** Middleware: require an admin role. */
export const requireAdmin: RequestHandler = (req, res, next) => {
  const authReq = req as AuthedRequest;
  if (!authReq.user || authReq.user.role !== "admin") {
    res.status(401).json({ success: false, error: { message: "admin only", code: "E_NO_AUTH" } });
    return;
  }
  next();
};

/** Pair: cookie-parser + loadSession. */
export const adminCookieParser: RequestHandler = cookieParser() as RequestHandler;

export const COOKIE = COOKIE_NAME;
