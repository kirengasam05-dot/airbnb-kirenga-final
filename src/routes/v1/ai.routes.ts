import { Router } from "express";
import {
  smartListingSearch,
  generateListingDescription,
  guestSupportChat,
  bookingRecommendation,
  listingReviewSummary,
} from "../../controllers/ai.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: AI
 *     description: Lesson 8 LangChain + Groq AI features
 */

/**
 * @swagger
 * /api/v1/ai/search:
 *   post:
 *     summary: Smart natural language listing search with pagination
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 example: "Find me a cheap apartment in Kigali with wifi"
 *               page:
 *                 type: integer
 *                 example: 1
 *               limit:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Search completed successfully
 */
router.post("/search", smartListingSearch);

/**
 * @swagger
 * /api/v1/ai/descriptions:
 *   post:
 *     summary: Generate AI listing description with tone control
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *               - type
 *               - amenities
 *             properties:
 *               title:
 *                 type: string
 *                 example: Modern Apartment Kigali
 *               location:
 *                 type: string
 *                 example: Kigali
 *               type:
 *                 type: string
 *                 example: APARTMENT
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["wifi", "parking", "kitchen"]
 *               tone:
 *                 type: string
 *                 example: professional
 *     responses:
 *       200:
 *         description: Description generated successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/descriptions", authenticate, generateListingDescription);

/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: Guest support chatbot with memory and listing context
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "How can I book an apartment?"
 *               listingId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Chat response generated successfully
 */
router.post("/chat", guestSupportChat);

/**
 * @swagger
 * /api/v1/ai/recommendations:
 *   post:
 *     summary: AI booking recommendation based on guest preferences
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - guests
 *               - budget
 *             properties:
 *               location:
 *                 type: string
 *                 example: Kigali
 *               guests:
 *                 type: integer
 *                 example: 2
 *               budget:
 *                 type: number
 *                 example: 80
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["wifi", "parking"]
 *     responses:
 *       200:
 *         description: Recommendation generated successfully
 */
router.post("/recommendations", bookingRecommendation);

/**
 * @swagger
 * /api/v1/ai/listings/{id}/review-summary:
 *   get:
 *     summary: Summarize listing reviews using AI
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Review summary generated successfully
 *       404:
 *         description: Listing not found
 */
router.get("/listings/:id/review-summary", listingReviewSummary);

export default router;