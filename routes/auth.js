const express = require("express");
const { register, login } = require("../controllers/authController");

const router = express.Router();

// 📌 Роут регистрации
router.post("/register", register);

// 📌 Роут логина
router.post("/login", login);

module.exports = router;
