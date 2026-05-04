import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type Role = "ADMIN" | "HOST" | "GUEST";

export interface AuthRequest extends Request {
  userId?: number;
  role?: Role;
}

type JwtPayload = {
  userId: number;
  role: Role;
  iat?: number;
  exp?: number;
};

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as JwtPayload;

    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.userId = Number(decoded.userId);
    req.role = decoded.role;

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authMiddleware = authenticate;

export const requireHost = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  if (req.role === "HOST" || req.role === "ADMIN") return next();

  return res.status(403).json({ message: "Forbidden: host access required" });
};

export const requireGuest = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  if (req.role === "GUEST" || req.role === "ADMIN") return next();

  return res.status(403).json({ message: "Forbidden: guest access required" });
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  if (req.role === "ADMIN") return next();

  return res.status(403).json({ message: "Forbidden: admin access required" });
};