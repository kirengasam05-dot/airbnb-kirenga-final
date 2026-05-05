import { Response } from "express";
import { ListingType, Role } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

const allowedTypes: ListingType[] = [
  ListingType.APARTMENT,
  ListingType.HOUSE,
  ListingType.VILLA,
  ListingType.CABIN,
];

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Unknown error";
};

// GET /api/v1/listings
export const getListings = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = String(req.query.search || "").trim();
    const location = String(req.query.location || "").trim();
    const type = String(req.query.type || "").trim();
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { location: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(location && {
        location: { contains: location, mode: "insensitive" as const },
      }),
      ...(type && allowedTypes.includes(type as ListingType)
        ? { type: type as ListingType }
        : {}),
      ...(maxPrice !== undefined ? { price: { lte: maxPrice } } : {}),
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              role: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return res.status(200).json({
      message: "Listings fetched successfully",
      listings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch listings",
      error: getErrorMessage(error),
    });
  }
};

// GET /api/v1/listings/:id
export const getListingById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

if (Number.isNaN(id)) {
  return res.status(400).json({ message: "Invalid listing id" });
}

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
          },
        },
        reviews: true,
        bookings: true,
      },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    return res.status(200).json({
      message: "Listing fetched successfully",
      listing,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch listing",
      error: getErrorMessage(error),
    });
  }
};

// POST /api/v1/listings
export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return res.status(401).json({ message: "User not found" });
    }

    if (currentUser.role !== Role.HOST && currentUser.role !== Role.ADMIN) {
      return res.status(403).json({
        message: "Only HOST or ADMIN can create listings",
      });
    }

    const {
      title,
      description,
      location,
      price,
      guests,
      type,
      amenities,
      image,
    } = req.body;

    if (
      !title ||
      !description ||
      !location ||
      price === undefined ||
      guests === undefined ||
      !type
    ) {
      return res.status(400).json({
        message: "Missing required listing fields",
      });
    }

    if (!allowedTypes.includes(type as ListingType)) {
      return res.status(400).json({
        message: "Invalid listing type",
        allowedTypes,
      });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        location,
        pricePerNight: Number(price),
        guests: Number(guests),
        type: type as ListingType,
        amenities: Array.isArray(amenities) ? amenities : [],
        image: image || null,
        hostId: req.userId,
      },
    });

    return res.status(201).json({
      message: "Listing created successfully",
      listing,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create listing",
      error: getErrorMessage(error),
    });
  }
};

// PUT /api/v1/listings/:id
export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

   const id = Number(req.params.id);

if (Number.isNaN(id)) {
  return res.status(400).json({ message: "Invalid listing id" });
}

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    const isOwner = listing.hostId === req.userId;
    const isAdmin = currentUser?.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You are not allowed to update this listing",
      });
    }

    const {
      title,
      description,
      location,
      price,
      guests,
      type,
      amenities,
      image,
    } = req.body;

    if (type && !allowedTypes.includes(type as ListingType)) {
      return res.status(400).json({
        message: "Invalid listing type",
        allowedTypes,
      });
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(price !== undefined && { price: Number(price) }),
        ...(guests !== undefined && { guests: Number(guests) }),
        ...(type !== undefined && { type: type as ListingType }),
        ...(amenities !== undefined && {
          amenities: Array.isArray(amenities) ? amenities : [],
        }),
        ...(image !== undefined && { image }),
      },
    });

    return res.status(200).json({
      message: "Listing updated successfully",
      listing: updatedListing,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update listing",
      error: getErrorMessage(error),
    });
  }
};

// DELETE /api/v1/listings/:id
export const deleteListing = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    const isOwner = listing.hostId === req.userId;
    const isAdmin = currentUser?.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You are not allowed to delete this listing",
      });
    }

    await prisma.listing.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Listing deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete listing",
      error: getErrorMessage(error),
    });
  }
};

// GET /api/v1/listings/host/my-listings
export const getListingsByHost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const listings = await prisma.listing.findMany({
      where: { hostId: req.userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      message: "Host listings fetched successfully",
      listings,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch host listings",
      error: getErrorMessage(error),
    });
  }
};
// 👉 TEMP FIXES to match your routes (no breaking changes)

export const getListingStats = async (_req: any, res: any) => {
  return res.status(200).json({
    message: "Listing stats endpoint (not implemented yet)",
  });
};

export const uploadListingPhotos = async (_req: any, res: any) => {
  return res.status(200).json({
    message: "Upload listing photos endpoint (not implemented yet)",
  });
};

export const deleteListingPhoto = async (_req: any, res: any) => {
  return res.status(200).json({
    message: "Delete listing photo endpoint (not implemented yet)",
  });
};

// Alias if your route imports getListingByHost instead of getListingsByHost
export const getListingByHost = getListingsByHost;