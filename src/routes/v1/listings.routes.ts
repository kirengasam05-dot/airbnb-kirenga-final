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

router.get("/", getAllListings);
router.get("/search", getAllListings);
router.get("/stats", getListingStats);

router.get("/admin/stats", authenticate, requireAdmin, getListingStats);

router.post("/", strictPostLimiter, authenticate, requireHost, createListing);

router.post(
  "/:id/photos",
  strictPostLimiter,
  authenticate,
  requireHost,
  upload.array("images", 5),
  uploadListingPhotos
);

router.delete(
  "/:id/photos/:photoId",
  authenticate,
  requireHost,
  deleteListingPhoto
);

router.get("/:id/reviews", getListingReviews);

router.post(
  "/:id/reviews",
  authenticate,
  requireGuest,
  addListingReview
);

router.put("/:id", authenticate, requireHost, updateListing);

router.delete("/:id", authenticate, requireHost, deleteListing);

router.get("/:id", getListingById);

export default router;