import { Router } from "express";

import {
  getAllListings,
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

import { authenticate, requireHost } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import { strictPostLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

/**
 * @swagger
 * /api/v1/listings:
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: Listings fetched successfully
 */
router.get("/", getAllListings);

/**
 * @swagger
 * /api/v1/listings/search:
 *   get:
 *     summary: Search listings
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: Search results fetched successfully
 */
router.get("/search", getAllListings);

/**
 * @swagger
 * /api/v1/listings/stats:
 *   get:
 *     summary: Get listing statistics
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: Listing stats fetched successfully
 */
router.get("/stats", getListingStats);

/**
 * @swagger
 * /api/v1/listings:
 *   post:
 *     summary: Create listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListingInput'
 *     responses:
 *       201:
 *         description: Listing created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", strictPostLimiter, authenticate, requireHost, createListing);

/**
 * @swagger
 * /api/v1/listings/{id}/photos:
 *   post:
 *     summary: Upload listing photos
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
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
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 */
router.delete(
  "/:id/photos/:photoId",
  authenticate,
  requireHost,
  deleteListingPhoto
);

/**
 * @swagger
 * /api/v1/listings/{id}/reviews:
 *   get:
 *     summary: Get listing reviews
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reviews fetched successfully
 */
router.get("/:id/reviews", getListingReviews);

/**
 * @swagger
 * /api/v1/listings/{id}/reviews:
 *   post:
 *     summary: Add listing review
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput'
 *     responses:
 *       201:
 *         description: Review added successfully
 */
router.post("/:id/reviews", authenticate, addListingReview);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing fetched successfully
 *       404:
 *         description: Listing not found
 */
router.get("/:id", getListingById);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   put:
 *     summary: Update listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListingInput'
 *     responses:
 *       200:
 *         description: Listing updated successfully
 */
router.put("/:id", authenticate, requireHost, updateListing);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   delete:
 *     summary: Delete listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 */
router.delete("/:id", authenticate, requireHost, deleteListing);

export default router;