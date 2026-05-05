import { Router } from "express";

import authRoutes from "./v1/auth.routes.js";
import usersRoutes from "./v1/users.routes.js";
import listingsRoutes from "./v1/listings.routes.js";
import bookingsRoutes from "./v1/bookings.routes.js";
import reviewsRoutes from "./v1/reviews.routes.js";
import uploadRoutes from "./v1/upload.routes.js";
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