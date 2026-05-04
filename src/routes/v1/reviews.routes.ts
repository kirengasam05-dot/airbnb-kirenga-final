import { Router } from "express";
import {
  createReview,
  getListingReviews,
  updateReview,
  deleteReview,
} from "../../controllers/reviews.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Review endpoints
 */

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Create a review
 *     tags: [Reviews]
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
 *               - rating
 *               - comment
 *             properties:
 *               listingId:
 *                 type: integer
 *                 example: 1
 *               rating:
 *                 type: integer
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Very nice place!
 */
router.post("/", authenticate, createReview);

/**
 * @swagger
 * /api/v1/reviews/listing/{listingId}:
 *   get:
 *     summary: Get reviews by listing
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Listing ID
 */
router.get("/listing/:listingId", getListingReviews);

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     summary: Update review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.put("/:id", authenticate, updateReview);

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete("/:id", authenticate, deleteReview);

export default router;