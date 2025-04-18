import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { initDB } from "./models/index.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import schoolAdminRoutes from "./routes/schoolAdminRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";



dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);
app.use(cookieParser());

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://meet.tamamat.com",
  "https://t.me", 
  "https://frontend-production-9845.up.railway.app",
  "https://web.telegram.org", 
];


app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});


app.use("/api/admin", adminRoutes);
app.use("/api", meetingRoutes);
app.use("/api", tokenRoutes);
app.use("/api", authRoutes);
app.use("/api", teacherRoutes);
app.use("/api/school-admins", schoolAdminRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/student", studentRoutes);




app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 The server is running on http://localhost:${PORT}`);
});
