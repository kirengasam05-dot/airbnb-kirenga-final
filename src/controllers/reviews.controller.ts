import { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { deleteCache } from "../utils/aiCache.js";

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { listingId, rating, comment } = req.body;

    if (!listingId || !rating || !comment) {
      return res.status(400).json({
        message: "listingId, rating and comment are required",
      });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        message: "rating must be between 1 and 5",
      });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: Number(listingId) },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.hostId === req.userId) {
      return res.status(400).json({
        message: "You cannot review your own listing",
      });
    }

    const review = await prisma.review.create({
      data: {
        listingId: Number(listingId),
        userId: req.userId,
        rating: Number(rating),
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
      },
    });

    deleteCache(`review-summary-${Number(listingId)}`);

    return res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to create review",
      error: error.message,
    });
  }
};

export const addListingReview = async (req: AuthRequest, res: Response) => {
  req.body.listingId = Number(req.params.id);
  return createReview(req, res);
};

export const getListingReviews = async (req: Request, res: Response) => {
  try {
    const listingId = Number(req.params.listingId || req.params.id);

    if (!listingId) {
      return res.status(400).json({
        message: "Valid listing id is required",
      });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    const reviews = await prisma.review.findMany({
      where: { listingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      count: reviews.length,
      reviews,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to get reviews",
      error: error.message,
    });
  }
};

export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = Number(req.params.id);
    const { rating, comment } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Valid review id is required",
      });
    }

    if (rating && (Number(rating) < 1 || Number(rating) > 5)) {
      return res.status(400).json({
        message: "rating must be between 1 and 5",
      });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId !== req.userId && req.role !== "ADMIN") {
      return res.status(403).json({
        message: "You can update only your own review",
      });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(rating ? { rating: Number(rating) } : {}),
        ...(comment ? { comment } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
      },
    });

    deleteCache(`review-summary-${review.listingId}`);

    return res.status(200).json({
      message: "Review updated successfully",
      review: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update review",
      error: error.message,
    });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Valid review id is required",
      });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId !== req.userId && req.role !== "ADMIN") {
      return res.status(403).json({
        message: "You can delete only your own review",
      });
    }

    await prisma.review.delete({
      where: { id },
    });

    deleteCache(`review-summary-${review.listingId}`);

    return res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to delete review",
      error: error.message,
    });
  }
};