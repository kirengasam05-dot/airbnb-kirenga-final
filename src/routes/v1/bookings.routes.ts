import { Router } from "express";

import {
  getAllBookings,
  getMyBookings,
  getBookingById,
  createBooking,
  cancelBooking,
  updateBookingStatus,
} from "../../controllers/bookings.controller.js";

import {
  authenticate,
  requireAdmin,
  requireGuest,
  requireHost,
} from "../../middlewares/auth.middleware.js";

import { strictPostLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

/* =======================
   GUEST BOOKING ROUTES
======================= */

router.get("/me", authenticate, requireGuest, getMyBookings);

router.post(
  "/",
  strictPostLimiter,
  authenticate,
  requireGuest,
  createBooking
);

router.patch(
  "/:id/cancel",
  authenticate,
  requireGuest,
  cancelBooking
);

/* =======================
   HOST BOOKING ROUTES
======================= */

router.get(
  "/host",
  authenticate,
  requireHost,
  getAllBookings
);

router.patch(
  "/:id/confirm",
  authenticate,
  requireHost,
  updateBookingStatus
);

router.patch(
  "/:id/host-cancel",
  authenticate,
  requireHost,
  cancelBooking
);

/* =======================
   ADMIN BOOKING ROUTES
======================= */

router.get(
  "/",
  authenticate,
  requireAdmin,
  getAllBookings
);

router.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  updateBookingStatus
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  cancelBooking
);

/* =======================
   SHARED PROTECTED ROUTES
======================= */

router.get(
  "/:id",
  authenticate,
  getBookingById
);

export default router;