import dotenv from "dotenv";
dotenv.config(); 

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID =
process.env.GOOGLE_CLIENT_ID;

const GOOGLE_CLIENT_SECRET =
process.env.GOOGLE_CLIENT_SECRET ;

const REDIRECT_URI = `${process.env.SERVER_URL}/api/google/callback`;
const JWT_SECRET = process.env.JWT_SECRET;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);
const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Register
export const register = async (req, res) => {
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
    console.error("❌ Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📩 Login request received with email:", email);

    if (!email || !password) {
      console.log("⚠️ Missing email or password");
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    console.log("👤 Fetched user:", user ? user.toJSON() : "Not found");

    if (!user) {
      console.log("❌ User not found with email:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔐 Password match:", isMatch);

    if (!isMatch) {
      console.log("❌ Invalid password for user:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

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

    console.log("✅ Authenticated:", {
      id: user.id,
      role: user.role,
      name,
      teacherId,
      adminId,
      schoolId,
    });

    const payload = {
      id: user.id,
      role: user.role,
      teacherId,
      adminId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    console.log("🔑 Generated JWT:", token);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

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
    console.error("❌ Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Google OAuth - Get Auth URL
export const getGoogleAuthUrl = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["profile", "email"],
  });
  res.json({ authUrl });
};

// Google OAuth Callback
export const googleCallback = async (req, res) => {
  console.log("start")
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ success: false, error: "Authorization code is missing" });
    }

    const { tokens } = await oauth2Client.getToken(code);
    console.log("TOKENS:", tokens); // <-- Посмотри, есть ли тут id_token

    if (!tokens.id_token) {
      return res.status(401).json({ success: false, error: "No id_token received from Google" });
    }

    oauth2Client.setCredentials(tokens);

    const ticket = await googleAuthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("Google Payload:", payload);

    const serverToken = jwt.sign(
      {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.redirect(`${process.env.CLIENT_URL}?token=${serverToken}`);
  } catch (error) {
    console.error("❌ Error in googleCallback:", error);
    return res.status(500).json({ success: false, error: "Google authentication failed" });
  }
};


// Session check
export const verifySession = async (req, res) => {
  console.log("verifySession")
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, JWT_SECRET);



    return res.json({ success: true, user: decodedToken });
  } catch (error) {
    console.error("❌ Session check error:", error);
    return res.status(401).json({ success: false, error: "Invalid session" });
  }
};

// Logout
export const logout = (req, res) => {
  res.clearCookie("sessionToken");
  res.redirect(`${process.env.CLIENT_URL}`);
};
