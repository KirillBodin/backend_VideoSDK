const express = require("express");
const { login, register } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
const express = require("express");
const { auth } = require("../firebaseAdmin"); // ✅ Firebase Admin SDK

// 🔹 Проверка токена Firebase
router.post("/verify-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    // 🔍 Проверяем токен
    const decodedToken = await auth.verifyIdToken(token);
    console.log("✅ Проверенный токен:", decodedToken);

    res.json({ uid: decodedToken.uid, email: decodedToken.email });
  } catch (error) {
    console.error("❌ Ошибка проверки токена:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;

module.exports = router;
