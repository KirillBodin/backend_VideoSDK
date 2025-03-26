
const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
const { loginRateLimiter } = require("../middlewares/rateLimiter.js");
const {
  register,
  login,
  getGoogleAuthUrl,
  googleCallback,
  verifySession,
  logout,
} = require("../controllers/authController");

router.use(cookieParser());


router.post("/register", register);
router.post("/auth/login", loginRateLimiter,login);


router.get("/google/url", getGoogleAuthUrl);
router.get("/google/callback", googleCallback);
router.get("/verify-session", verifySession);
router.get("/logout", logout);

module.exports = router;
