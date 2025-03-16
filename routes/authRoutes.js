// routes/auth.js
const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");

// Импорт всех методов из контроллера
const {
  register,
  login,
  getGoogleAuthUrl,
  googleCallback,
  verifySession,
  logout,
} = require("../controllers/authController");

// Мидлварь cookieParser (если не подключена глобально в app.js)
router.use(cookieParser());

// Роуты локальной регистрации/логина
router.post("/register", register);
router.post("/login", login);

// Роуты Google OAuth
router.get("/google/url", getGoogleAuthUrl);
router.get("/google/callback", googleCallback);
router.get("/verify-session", verifySession);
router.get("/logout", logout);

module.exports = router;
