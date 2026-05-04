import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import listingsRoutes from "./listings.routes.js";
import bookingsRoutes from "./bookings.routes.js";
import reviewsRoutes from "./reviews.routes.js";
import uploadRoutes from "./upload.routes.js";
import aiRoutes from "./ai.routes.js";

const router = Router();
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/listings", listingsRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/upload", uploadRoutes);
router.use("/ai", aiRoutes);

export default router;
