import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import { uploadSingleImage } from "../../controllers/upload.controller.js";

const router = Router();
router.post("/image", authenticate, upload.single("image"), uploadSingleImage);
export default router;
