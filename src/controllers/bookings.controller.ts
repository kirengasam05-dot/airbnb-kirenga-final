import { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { sendEmail } from "../config/email.js";
import { bookingConfirmationEmail, bookingCancellationEmail } from "../templates/emails.js";
import { pageData, meta } from "../utils/pagination.js";

const bookingInclude = {
  guest: { select: { id: true, name: true, email: true, username: true } },
  listing: { include: { photos: true, host: { select: { id: true, name: true, email: true } } } }
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export const getAllBookings = async (req: AuthRequest, res: Response) => {
  const { page, limit, skip } = pageData(req);
  const [data, total] = await Promise.all([
    prisma.booking.findMany({ skip, take: limit, include: bookingInclude, orderBy: { createdAt: "desc" } }),
    prisma.booking.count()
  ]);
  return res.status(200).json({ data, meta: meta(total, page, limit) });
};

export const getBookingById = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (req.role !== "ADMIN" && req.userId !== booking.guestId && req.userId !== booking.listing.hostId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return res.status(200).json(booking);
};

export const getMyBookings = async (req: AuthRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
  const { page, limit, skip } = pageData(req);
  const [data, total] = await Promise.all([
    prisma.booking.findMany({ where: { guestId: req.userId }, skip, take: limit, include: bookingInclude, orderBy: { createdAt: "desc" } }),
    prisma.booking.count({ where: { guestId: req.userId } })
  ]);
  return res.status(200).json({ data, meta: meta(total, page, limit) });
};

export const getBookingsByUserId = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const { page, limit, skip } = pageData(req);
  const [data, total] = await Promise.all([
    prisma.booking.findMany({ where: { guestId: userId }, skip, take: limit, include: bookingInclude, orderBy: { createdAt: "desc" } }),
    prisma.booking.count({ where: { guestId: userId } })
  ]);
  return res.status(200).json({ userId, data, meta: meta(total, page, limit) });
};

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const { listingId, checkIn, checkOut, guests = 1 } = req.body;
    if (!listingId || !checkIn || !checkOut) return res.status(400).json({ message: "listingId, checkIn and checkOut are required" });
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ message: "Invalid date format" });
    if (start >= end) return res.status(400).json({ message: "checkOut must be after checkIn" });

    const booking = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id: Number(listingId) } });
      if (!listing) throw new Error("LISTING_NOT_FOUND");
      if (listing.hostId === req.userId) throw new Error("OWN_LISTING");
      if (Number(guests) > listing.guests) throw new Error("TOO_MANY_GUESTS");
      const conflict = await tx.booking.findFirst({
        where: { listingId: Number(listingId), status: { not: "CANCELLED" }, checkIn: { lt: end }, checkOut: { gt: start } }
      });
      if (conflict) throw new Error("BOOKING_CONFLICT");
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return tx.booking.create({
        data: { listingId: Number(listingId), guestId: req.userId!, checkIn: start, checkOut: end, guests: Number(guests), totalPrice: nights * listing.pricePerNight, status: "CONFIRMED" },
        include: { guest: { select: { id: true, name: true, email: true, username: true } }, listing: true }
      });
    });

    await sendEmail(booking.guest.email, "Booking Confirmation", bookingConfirmationEmail(booking.guest.name, booking.listing.title, booking.listing.location, formatDate(booking.checkIn), formatDate(booking.checkOut), booking.totalPrice));
    return res.status(201).json({ message: "Booking created", booking });
  } catch (error: any) {
    if (error.message === "LISTING_NOT_FOUND") return res.status(404).json({ message: "Listing not found" });
    if (error.message === "OWN_LISTING") return res.status(400).json({ message: "You cannot book your own listing" });
    if (error.message === "TOO_MANY_GUESTS") return res.status(400).json({ message: "Guests exceed listing capacity" });
    if (error.message === "BOOKING_CONFLICT") return res.status(409).json({ message: "Booking conflict: dates already booked" });
    return res.status(500).json({ message: "Failed to create booking", error: error.message });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const booking = await prisma.booking.findUnique({ where: { id }, include: { guest: true, listing: true } });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.guestId !== req.userId && req.role !== "ADMIN") return res.status(403).json({ message: "You can cancel only your own booking" });
  if (booking.status === "CANCELLED") return res.status(400).json({ message: "Booking is already cancelled" });
  const updated = await prisma.booking.update({ where: { id }, data: { status: "CANCELLED" }, include: { guest: true, listing: true } });
  await sendEmail(updated.guest.email, "Booking Cancelled", bookingCancellationEmail(updated.guest.name, updated.listing.title, formatDate(updated.checkIn), formatDate(updated.checkOut)));
  return res.status(200).json({ message: "Booking cancelled", booking: updated });
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) return res.status(400).json({ message: "Invalid booking status" });
  const booking = await prisma.booking.update({ where: { id }, data: { status } });
  return res.status(200).json({ message: "Booking status updated", booking });
};
