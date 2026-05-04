import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import path from "path";

import routes from "./routes/v1/index.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

// ================= MIDDLEWARES =================
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ================= STATIC =================
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ================= SWAGGER =================
setupSwagger(app);

// ================= ROOT =================
app.get("/", (_req, res) => {
  res.json({
    message: "Airbnb API is running",
    docs: "/api-docs",
    base: "/api/v1",
  });
});

// ================= HEALTH =================
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ================= ROUTES =================
app.use("/api/v1", routes);

// ================= ERROR HANDLER =================
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("ERROR:", err);

  res.status(500).json({
    message: "Something went wrong",
    error: err?.message || err,
  });
});

// ================= 404 =================
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ================= START =================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});