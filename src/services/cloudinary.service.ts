import fs from "fs";
import { cloudinary } from "../config/cloudinary.js";

export async function uploadToCloudinary(filePath: string, folder: string) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return { url: `/uploads/${filePath.split(/[\\/]/).pop()}`, publicId: filePath };
  }

  const result = await cloudinary.uploader.upload(filePath, { folder });
  try { fs.unlinkSync(filePath); } catch {}
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteFromCloudinary(publicId?: string | null) {
  if (!publicId || publicId.includes("uploads")) return;
  try { await cloudinary.uploader.destroy(publicId); } catch {}
}
