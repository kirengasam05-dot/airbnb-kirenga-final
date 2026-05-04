import { Request, Response } from "express";
import { ListingType, Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { pageData, meta } from "../utils/pagination.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinary.service.js";

const listingInclude = {
  photos: true,
  host: { select: { id: true, name: true, email: true, username: true, avatar: true } },
  _count: { select: { bookings: true, reviews: true } }
};

function buildListingWhere(query: any): Prisma.ListingWhereInput {
  const { search, location, type, minPrice, maxPrice, guests, amenities } = query;
  const where: Prisma.ListingWhereInput = {};

  if (typeof search === "string" && search.trim()) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } }
    ];
  }
  if (typeof location === "string" && location.trim()) where.location = { contains: location, mode: "insensitive" };
  if (typeof type === "string" && type.trim() && Object.values(ListingType).includes(type.toUpperCase() as ListingType)) {
    where.type = type.toUpperCase() as ListingType;
  }
  if (guests) where.guests = { gte: Number(guests) };
  if (minPrice || maxPrice) {
    where.pricePerNight = {
      ...(minPrice ? { gte: Number(minPrice) } : {}),
      ...(maxPrice ? { lte: Number(maxPrice) } : {})
    };
  }
  if (typeof amenities === "string" && amenities.trim()) {
    where.amenities = { hasEvery: amenities.split(",").map((x) => x.trim()).filter(Boolean) };
  }
  return where;
}

export const getAllListings = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = pageData(req);
    const where = buildListingWhere(req.query);
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({ where, skip, take: limit, include: listingInclude, orderBy: { createdAt: "desc" } }),
      prisma.listing.count({ where })
    ]);
    return res.status(200).json({ listings, meta: meta(total, page, limit) });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to get listings", error: error.message });
  }
};

export const getListingById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const listing = await prisma.listing.findUnique({ where: { id }, include: { ...listingInclude, bookings: true, reviews: true } });
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  return res.status(200).json(listing);
};

export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const { title, description, location, pricePerNight, guests, type, amenities, rating } = req.body;
    if (!title || !description || !location || !pricePerNight) return res.status(400).json({ message: "Missing required listing fields" });

    const upperType = String(type || "APARTMENT").toUpperCase();
    if (!Object.values(ListingType).includes(upperType as ListingType)) return res.status(400).json({ message: "Invalid listing type", allowedTypes: Object.values(ListingType) });

    const listing = await prisma.listing.create({
      data: {
        title, description, location, pricePerNight: Number(pricePerNight), guests: guests ? Number(guests) : 1,
        type: upperType as ListingType, amenities: Array.isArray(amenities) ? amenities : [], rating: rating ? Number(rating) : null, hostId: req.userId
      },
      include: listingInclude
    });
    return res.status(201).json({ message: "Listing created successfully", listing });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to create listing", error: error.message });
  }
};

export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.hostId !== req.userId && req.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

    const data: Prisma.ListingUpdateInput = {};
    for (const key of ["title", "description", "location"] as const) if (req.body[key]) data[key] = req.body[key];
    if (req.body.pricePerNight) data.pricePerNight = Number(req.body.pricePerNight);
    if (req.body.guests) data.guests = Number(req.body.guests);
    if (req.body.rating) data.rating = Number(req.body.rating);
    if (Array.isArray(req.body.amenities)) data.amenities = req.body.amenities;
    if (req.body.type) data.type = String(req.body.type).toUpperCase() as ListingType;

    const updated = await prisma.listing.update({ where: { id }, data, include: listingInclude });
    return res.status(200).json({ message: "Listing updated", listing: updated });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to update listing", error: error.message });
  }
};

export const deleteListing = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  if (listing.hostId !== req.userId && req.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  await prisma.listing.delete({ where: { id } });
  return res.status(200).json({ message: "Listing deleted successfully" });
};

export const uploadListingPhotos = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = Number(req.params.id);
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.hostId !== req.userId && req.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
    if (!req.files || !Array.isArray(req.files)) return res.status(400).json({ message: "No files uploaded" });

    const photos = [];
    for (const file of req.files as Express.Multer.File[]) {
      const uploaded = await uploadToCloudinary(file.path, "airbnb/listings");
      photos.push(await prisma.listingPhoto.create({ data: { url: uploaded.url, publicId: uploaded.publicId, listingId } }));
    }
    return res.status(200).json({ message: "Photos uploaded successfully", photos });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed to upload photos", error: error.message });
  }
};

export const deleteListingPhoto = async (req: AuthRequest, res: Response) => {
  const listingId = Number(req.params.id);
  const photoId = Number(req.params.photoId);
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  if (listing.hostId !== req.userId && req.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  const photo = await prisma.listingPhoto.findUnique({ where: { id: photoId } });
  if (!photo) return res.status(404).json({ message: "Photo not found" });
  await deleteFromCloudinary(photo.publicId);
  await prisma.listingPhoto.delete({ where: { id: photoId } });
  return res.status(200).json({ message: "Photo deleted successfully" });
};

export const getListingStats = async (_req: Request, res: Response) => {
  const stats = await prisma.$queryRaw`
    SELECT location, COUNT(*)::int AS total_listings, AVG("pricePerNight")::float AS average_price,
    MIN("pricePerNight")::float AS min_price, MAX("pricePerNight")::float AS max_price
    FROM "Listing" GROUP BY location ORDER BY total_listings DESC
  `;
  return res.status(200).json({ message: "Listing stats fetched successfully", stats });
};
