import { Router } from "express";

import {
  getListings as getAllListings,
  getListingById,
  getListingStats,
  createListing,
  updateListing,
  deleteListing,
  uploadListingPhotos,
  deleteListingPhoto,
} from "../../controllers/listings.controller.js";

import {
  getListingReviews,
  addListingReview,
} from "../../controllers/reviews.controller.js";

import {
  authenticate,
  requireHost,
  requireGuest,
  requireAdmin,
} from "../../middlewares/auth.middleware.js";

import upload from "../../middlewares/upload.middleware.js";
import { strictPostLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

/* =========================================================
   PUBLIC LISTING ROUTES
========================================================= */

/**
 * @swagger
 * /api/v1/listings:
 *   get:
 *     summary: Get all active listings
 *     description: Public route. Guests can browse listings created by hosts.
 *     tags: [Listings]
 */
router.get("/", getAllListings);

/**
 * @swagger
 * /api/v1/listings/search:
 *   get:
 *     summary: Search listings
 *     description: Public listing search route.
 *     tags: [Listings]
 */
router.get("/search", getAllListings);

/**
 * @swagger
 * /api/v1/listings/stats:
 *   get:
 *     summary: Get listing statistics
 *     tags: [Listings]
 */
router.get("/stats", getListingStats);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     tags: [Listings]
 */
router.get("/:id", getListingById);

/* =========================================================
   HOST + ADMIN LISTING MANAGEMENT
========================================================= */

/**
 * @swagger
 * /api/v1/listings:
 *   post:
 *     summary: Create listing
 *     description: HOST or ADMIN can create listings.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  strictPostLimiter,
  authenticate,
  requireHost,
  createListing
);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   put:
 *     summary: Update listing
 *     description: HOST owner or ADMIN can update listing.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:id",
  authenticate,
  requireHost,
  updateListing
);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   delete:
 *     summary: Delete listing
 *     description: HOST owner or ADMIN can delete listing.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  authenticate,
  requireHost,
  deleteListing
);

/* =========================================================
   LISTING PHOTO MANAGEMENT
========================================================= */

/**
 * @swagger
 * /api/v1/listings/{id}/photos:
 *   post:
 *     summary: Upload listing photos
 *     description: HOST owner or ADMIN uploads photos.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:id/photos",
  strictPostLimiter,
  authenticate,
  requireHost,
  upload.array("images", 5),
  uploadListingPhotos
);

/**
 * @swagger
 * /api/v1/listings/{id}/photos/{photoId}:
 *   delete:
 *     summary: Delete listing photo
 *     description: HOST owner or ADMIN deletes photos.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id/photos/:photoId",
  authenticate,
  requireHost,
  deleteListingPhoto
);

/* =========================================================
   REVIEWS
========================================================= */

/**
 * @swagger
 * /api/v1/listings/{id}/reviews:
 *   get:
 *     summary: Get listing reviews
 *     tags: [Listings]
 */
router.get("/:id/reviews", getListingReviews);

/**
 * @swagger
 * /api/v1/listings/{id}/reviews:
 *   post:
 *     summary: Add listing review
 *     description: Only authenticated GUEST or ADMIN can review listings.
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:id/reviews",
  authenticate,
  requireGuest,
  addListingReview
);

/* =========================================================
   ADMIN ROUTES
========================================================= */

/**
 * @swagger
 * /api/v1/listings/admin/stats:
 *   get:
 *     summary: Admin listing analytics
 *     description: ADMIN only route.
 *     tags: [Admin Listings]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/stats",
  authenticate,
  requireAdmin,
  getListingStats
);

export default router;