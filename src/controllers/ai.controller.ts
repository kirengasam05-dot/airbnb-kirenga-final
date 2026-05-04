import { Response } from "express";
import { ListingType, Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { aiExtractSearchFilters, generateDescription, supportChat, explainRecommendations, summarizeReviews } from "../services/ai.service.js";
import { pageData, meta } from "../utils/pagination.js";

function whereFromFilters(filters: any): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {};
  if (filters.keyword) {
    where.OR = [
      { title: { contains: filters.keyword, mode: "insensitive" } },
      { description: { contains: filters.keyword, mode: "insensitive" } },
      { location: { contains: filters.keyword, mode: "insensitive" } }
    ];
  }
  if (filters.location) where.location = { contains: String(filters.location), mode: "insensitive" };
  if (filters.type && Object.values(ListingType).includes(String(filters.type).toUpperCase() as ListingType)) where.type = String(filters.type).toUpperCase() as ListingType;
  if (filters.guests) where.guests = { gte: Number(filters.guests) };
  if (filters.minPrice || filters.maxPrice) where.pricePerNight = { ...(filters.minPrice ? { gte: Number(filters.minPrice) } : {}), ...(filters.maxPrice ? { lte: Number(filters.maxPrice) } : {}) };
  if (Array.isArray(filters.amenities) && filters.amenities.length) where.amenities = { hasEvery: filters.amenities.map(String) };
  return where;
}

export const smartListingSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: "query is required" });
    const { page, limit, skip } = pageData(req);
    const extraction = await aiExtractSearchFilters(String(query));
    const where = whereFromFilters(extraction.filters);
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({ where, skip, take: limit, include: { photos: true, host: { select: { id: true, name: true, email: true } } }, orderBy: [{ rating: "desc" }, { createdAt: "desc" }] }),
      prisma.listing.count({ where })
    ]);
    return res.status(200).json({ message: "Smart search completed", query, extractedFilters: extraction.filters, aiUsed: extraction.aiUsed, listings, meta: meta(total, page, limit) });
  } catch (error: any) {
    return res.status(500).json({ message: "AI search failed", error: error.message });
  }
};

export const generateListingDescription = async (req: AuthRequest, res: Response) => {
  try {
    const description = await generateDescription(req.body);
    return res.status(200).json({ message: "Description generated", description });
  } catch (error: any) {
    return res.status(500).json({ message: "Description generation failed", error: error.message });
  }
};

export const guestSupportChat = async (req: AuthRequest, res: Response) => {
  try {
    const { message, listingId, sessionId = `user-${req.userId || "guest"}` } = req.body;
    if (!message) return res.status(400).json({ message: "message is required" });
    const listing = listingId ? await prisma.listing.findUnique({ where: { id: Number(listingId) }, include: { photos: true, reviews: true } }) : null;
    const reply = await supportChat(String(sessionId), String(message), listing);
    return res.status(200).json({ sessionId, listingId: listing?.id || null, ...reply });
  } catch (error: any) {
    return res.status(500).json({ message: "Chatbot failed", error: error.message });
  }
};

export const bookingRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const { location, budget, guests, amenities = [], checkIn, checkOut } = req.body;
    const where: Prisma.ListingWhereInput = {
      ...(location ? { location: { contains: String(location), mode: "insensitive" } } : {}),
      ...(guests ? { guests: { gte: Number(guests) } } : {}),
      ...(budget ? { pricePerNight: { lte: Number(budget) } } : {}),
      ...(Array.isArray(amenities) && amenities.length ? { amenities: { hasEvery: amenities } } : {})
    };

    const listings = await prisma.listing.findMany({ where, include: { photos: true, reviews: true }, take: 10, orderBy: [{ rating: "desc" }, { pricePerNight: "asc" }] });
    const start = checkIn ? new Date(checkIn) : null;
    const end = checkOut ? new Date(checkOut) : null;
    let available = listings;
    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const conflicts = await prisma.booking.findMany({ where: { status: { not: "CANCELLED" }, checkIn: { lt: end }, checkOut: { gt: start } }, select: { listingId: true } });
      const blocked = new Set(conflicts.map((b) => b.listingId));
      available = listings.filter((l) => !blocked.has(l.id));
    }
    const explanation = await explainRecommendations(req.body, available.slice(0, 5));
    return res.status(200).json({ message: "Recommendations generated", count: available.length, recommendations: available.slice(0, 5), explanation });
  } catch (error: any) {
    return res.status(500).json({ message: "Recommendation failed", error: error.message });
  }
};

export const listingReviewSummary = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = Number(req.params.id);
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    const reviews = await prisma.review.findMany({ where: { listingId }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
    const summary = await summarizeReviews(listing, reviews);
    return res.status(200).json({ listingId, reviewCount: reviews.length, summary });
  } catch (error: any) {
    return res.status(500).json({ message: "Review summary failed", error: error.message });
  }
};
