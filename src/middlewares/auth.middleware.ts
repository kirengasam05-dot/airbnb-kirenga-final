import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type Role = "ADMIN" | "HOST" | "GUEST";

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

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId || !req.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({
        message: `Forbidden: allowed roles are ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

export const requireHost = authorizeRoles("HOST", "ADMIN");

export const requireGuest = authorizeRoles("GUEST", "ADMIN");

export const requireAdmin = authorizeRoles("ADMIN");