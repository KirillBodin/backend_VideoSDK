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
app.use(
  cors({
    origin: "https://meet.tamamat.com",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());


app.use("/api/admin", adminRoutes);
app.use("/api", meetingRoutes);
app.use("/api", tokenRoutes);
app.use("/api", authRoutes);
app.use("/api", teacherRoutes);
app.use("/api/school-admins", schoolAdminRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/student", studentRoutes);


const buildPath = path.join(__dirname, "../build");
app.use(express.static(buildPath)); 


app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});


app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
