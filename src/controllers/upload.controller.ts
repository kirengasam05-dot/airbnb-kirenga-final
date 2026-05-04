import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";

export const uploadSingleImage = async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const uploaded = await uploadToCloudinary(req.file.path, "airbnb/misc");
  return res.status(200).json({ message: "File uploaded", file: uploaded });
};
