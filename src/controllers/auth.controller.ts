import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { Role } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendEmail } from "../config/email.js";
import { passwordResetEmail } from "../templates/emails.js";

function signToken(userId: number, role: Role) {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "7d",
  };

  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || "secret",
    options
  );
}

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  phone: true,
  role: true,
  avatar: true,
  avatarPublicId: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
};

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, username, phone, password, role } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({
        message: "name, email, username and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const selectedRole: Role =
      role === "HOST" || role === "ADMIN" ? role : "GUEST";

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email or username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        phone,
        password: hashedPassword,
        role: selectedRole,
      },
      select: publicUserSelect,
    });

    return res.status(201).json({
      message: "Register successful",
      user,
      token: signToken(user.id, user.role),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Register failed",
      error: error.message,
    });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const { password: _password, resetToken, resetTokenExpiry, ...safeUser } =
      user;

    return res.status(200).json({
      message: "Login successful",
      user: safeUser,
      token: signToken(user.id, user.role),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: publicUserSelect,
    });

    return res.status(200).json({ user });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to get user",
      error: error.message,
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "currentPassword and newPassword are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);

    if (!valid) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to change password",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "email is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(200).json({
        message: "If this email exists, reset instructions were sent",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 1000 * 60 * 30),
      },
    });

    const resetUrl = `${
      process.env.API_URL || "http://localhost:3000"
    }/api/v1/auth/reset-password/${token}`;

    await sendEmail(
      user.email,
      "Password Reset",
      passwordResetEmail(user.name, resetUrl)
    );

    return res.status(200).json({
      message: "Password reset link generated",
      resetToken: token,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Forgot password failed",
      error: error.message,
    });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const tokenParam = req.params.token;
    const { newPassword } = req.body;

    if (!tokenParam || !newPassword) {
      return res.status(400).json({
        message: "token and newPassword are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

    const hashedToken = crypto
      .createHash("sha256")
      .update(String(token))
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Reset password failed",
      error: error.message,
    });
  }
};