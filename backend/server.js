import 'dotenv/config';
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import { initDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import boardingRoutes from "./routes/boardings.js";
import vehicleRoutes from "./routes/vehicles.js";
import landRoutes from "./routes/lands.js";
import userRoutes from "./routes/users.js";
import notificationRoutes from "./routes/notifications.js";
import reviewsRoutes from "./routes/reviews.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
     "https://find-your-perfect-choice.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    application: "Bodim API",
    status: "Online",
    message: "Backend is running successfully 🚀"
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    message: "Bodim API is healthy"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/boardings", boardingRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/lands", landRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewsRoutes);

app.use((err, req, res, next) => {
  console.error("Express Global Error:", err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("===================================");
      console.log("🏠 Bodim Backend Started");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("===================================");
    });
  })
  .catch((err) => {
    console.error("❌ Failed to initialize database");
    console.error(err);
    process.exit(1);
  });