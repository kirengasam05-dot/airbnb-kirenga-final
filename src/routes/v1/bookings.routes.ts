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
} from "../../middlewares/auth.middleware.js";

import { strictPostLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Bookings
 *     description: Booking endpoints
 */

/**
 * @swagger
 * /api/v1/bookings/me:
 *   get:
 *     summary: Get my bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My bookings fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, getMyBookings);

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get all bookings Admin only
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All bookings fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", authenticate, requireAdmin, getAllBookings);

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listingId
 *               - checkIn
 *               - checkOut
 *               - guests
 *             properties:
 *               listingId:
 *                 type: integer
 *                 example: 1
 *               checkIn:
 *                 type: string
 *                 example: "2026-06-10"
 *               checkOut:
 *                 type: string
 *                 example: "2026-06-15"
 *               guests:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid booking data
 *       401:
 *         description: Unauthorized
 */
router.post("/", strictPostLimiter, authenticate, requireGuest, createBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get booking by id
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Booking fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.get("/:id", authenticate, getBookingById);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   delete:
 *     summary: Delete booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.delete("/:id", authenticate, cancelBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Change of plans"
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.patch("/:id/cancel", authenticate, cancelBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status Admin only
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: CONFIRMED
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch("/:id/status", authenticate, requireAdmin, updateBookingStatus);

export default router;