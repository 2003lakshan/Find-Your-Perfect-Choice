import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import { initDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import boardingRoutes from "./routes/boardings.js";
import userRoutes from "./routes/users.js";

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
app.use("/api/users", userRoutes);

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