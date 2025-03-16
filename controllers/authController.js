// controllers/authController.js
const dotenv = require("dotenv");
dotenv.config(); // Загружаем переменные окружения

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");




dotenv.config();



// Если нет в .env, берём дефолт
const CLIENT_URL =
  process.env.CLIENT_URL ||
  "https://meet.tamamat.com";

// Если нет в .env, берём дефолт
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "876289977924-83dhsl9b24h60dotb6vajagvss0pfnbl.apps.googleusercontent.com";

// Если нет в .env, подставляем дефолт
const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || "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";

// Аналогично для DATABASE_URL
const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://videosdk_db_user:iiu5vDshdBNSIvKNFmCGIjH0FFlQOwC6@dpg-cvas2oaj1k6c7390q660-a.oregon-postgres.render.com/videosdk_db";


const REDIRECT_URI = `http://localhost:5000/api/auth/google/callback`;

const JWT_SECRET = "your_jwt_secret"; // ❗️ Замените на безопасный ключ

// Создаём OAuth2 клиент
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);
const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Регистрация пользователя
 */
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Email, password, and role are required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, role });

    return res
      .status(201)
      .json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("❌ Ошибка регистрации:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Логин пользователя (локальная аутентификация)
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Пример: вы можете добавить разные данные в Payload токена
    let schoolId = null;
    let name = null;
    let teacherId = null;
    let adminId = null;

    if (user.role === "teacher") {
      teacherId = user.id;
      name = user.name?.replace(/\s+/g, "_") || null;
      schoolId = user.schoolId || null;
    } else if (user.role === "admin") {
      adminId = user.id;
      name = user.name?.replace(/\s+/g, "_") || null;
      schoolId = user.schoolId || null;
    } else if (user.role === "superadmin") {
      adminId = user.id;
      name = user.name?.replace(/\s+/g, "_") || null;
    }

    // Генерация JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, teacherId, adminId },
      process.env.JWT_SECRET || JWT_SECRET, // Можете брать из .env
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      teacherId,
      name,
      schoolId,
      adminId,
    });
  } catch (error) {
    console.error("❌ Ошибка логина:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Генерация Google OAuth URL
 */
exports.getGoogleAuthUrl = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["profile", "email"],
  });
  res.json({ authUrl });
};

/**
 * Callback после успешного входа через Google
 */
exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res
        .status(400)
        .json({ success: false, error: "Authorization code is missing" });
    }

    // Обмениваем code на токены
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Проверяем id_token (JWT от Google)
    const ticket = await googleAuthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("✅ Google User:", payload);

    // Генерация собственного JWT (серверного)
    const serverToken = jwt.sign(
      {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Записываем JWT в httpOnly cookie
    res.cookie("sessionToken", serverToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000, // 1 час
    });

    // Можно редиректить на фронтенд
    return res.redirect("http://localhost:3000");
  } catch (error) {
    console.error("❌ Ошибка входа через Google:", error);
    return res
      .status(500)
      .json({ success: false, error: "Google authentication failed" });
  }
};

/**
 * Проверка сессии (JWT в cookie)
 */
exports.verifySession = async (req, res) => {
  try {
    const sessionToken = req.cookies.sessionToken;
    if (!sessionToken) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const decodedToken = jwt.verify(sessionToken, JWT_SECRET);
    console.log("✅ Верифицированный пользователь:", decodedToken.email);

    return res.json({ success: true, user: decodedToken });
  } catch (error) {
    console.error("❌ Ошибка проверки сессии:", error);
    return res.status(401).json({ success: false, error: "Invalid session" });
  }
};

/**
 * Выход (очищаем cookie)
 */
exports.logout = (req, res) => {
  res.clearCookie("sessionToken");
  res.redirect("http://localhost:3000");
};
