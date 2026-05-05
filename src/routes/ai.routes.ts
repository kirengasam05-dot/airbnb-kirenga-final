import { Router } from "express";
import {
  generateListingDescription,
  smartListingSearch,
  guestSupportChat,
  bookingRecommendation,
  listingReviewSummary
} from "../controllers/ai.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: AI
 *     description: Lesson 8 AI-powered endpoints
 */

router.get("/test", (_req, res) => {
  res.json({ message: "AI route is working" });
});

/**
 * @swagger
 * /api/v1/ai/search:
 *   post:
 *     summary: Smart AI search
 *     tags: [AI]
 */
router.post("/search", smartListingSearch);

/**
 * @swagger
 * /api/v1/ai/listings/{id}/generate-description:
 *   post:
 *     summary: Generate listing description (DB-based)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/listings/:id/generate-description",
  authenticate,
  generateListingDescription
);

/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: AI chatbot
 *     tags: [AI]
 */
router.post("/chat", guestSupportChat);

/**
 * @swagger
 * /api/v1/ai/recommend:
 *   post:
 *     summary: AI recommendation
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
router.post("/recommend", authenticate, bookingRecommendation);

/**
 * @swagger
 * /api/v1/ai/listings/{id}/review-summary:
 *   get:
 *     summary: Review summary
 *     tags: [AI]
 */
router.get("/listings/:id/review-summary", listingReviewSummary);

export default router;