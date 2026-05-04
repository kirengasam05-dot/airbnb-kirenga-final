import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { pageData, meta } from "../utils/pagination.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinary.service.js";

const publicUserSelect = { id: true, name: true, email: true, username: true, phone: true, role: true, avatar: true, avatarPublicId: true, verified: true, createdAt: true, updatedAt: true };

export const getAllUsers = async (req: Request, res: Response) => {
  const { page, limit, skip } = pageData(req);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const where = search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }, { username: { contains: search, mode: "insensitive" as const } }] } : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, select: publicUserSelect, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where })
  ]);
  return res.status(200).json({ users, meta: meta(total, page, limit) });
};

export const getUserById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({ where: { id }, select: { ...publicUserSelect, listings: true, reviews: true } });
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.status(200).json(user);
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: publicUserSelect });
  return res.status(200).json(user);
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (req.userId !== id && req.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  const data: any = {};
  for (const key of ["name", "username", "phone"] as const) if (req.body[key]) data[key] = req.body[key];
  if (req.body.password) data.password = await bcrypt.hash(req.body.password, 10);
  const user = await prisma.user.update({ where: { id }, data, select: publicUserSelect });
  return res.status(200).json({ message: "User updated", user });
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (req.userId !== id && req.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  await prisma.user.delete({ where: { id } });
  return res.status(200).json({ message: "User deleted successfully" });
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (req.userId !== id && req.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ message: "User not found" });
  if (current.avatarPublicId) await deleteFromCloudinary(current.avatarPublicId);
  const uploaded = await uploadToCloudinary(req.file.path, "airbnb/avatars");
  const user = await prisma.user.update({ where: { id }, data: { avatar: uploaded.url, avatarPublicId: uploaded.publicId }, select: publicUserSelect });
  return res.status(200).json({ message: "Avatar uploaded", user });
};

export const deleteAvatar = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (req.userId !== id && req.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: "User not found" });
  await deleteFromCloudinary(user.avatarPublicId);
  const updated = await prisma.user.update({ where: { id }, data: { avatar: null, avatarPublicId: null }, select: publicUserSelect });
  return res.status(200).json({ message: "Avatar deleted", user: updated });
};

export const getUserStats = async (_req: Request, res: Response) => {
  const [users, hosts, guests, admins] = await Promise.all([
    prisma.user.count(), prisma.user.count({ where: { role: "HOST" } }), prisma.user.count({ where: { role: "GUEST" } }), prisma.user.count({ where: { role: "ADMIN" } })
  ]);
  return res.status(200).json({ users, hosts, guests, admins });
};
