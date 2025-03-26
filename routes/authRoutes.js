import express from "express";
import cookieParser from "cookie-parser";
import { loginRateLimiter } from "../middlewares/rateLimiter.js";
import {
  register,
  login,
  getGoogleAuthUrl,
  googleCallback,
  verifySession,
  logout,
} from "../controllers/authController.js";

const router = express.Router();

router.use(cookieParser());

router.post("/register", register);
router.post("/auth/login", loginRateLimiter, login);

router.get("/google/url", getGoogleAuthUrl);
router.get("/google/callback", googleCallback);
router.get("/verify-session", verifySession);
router.get("/logout", logout);

export default router;
