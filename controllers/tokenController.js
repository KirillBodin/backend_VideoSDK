import jwt from "jsonwebtoken";

export const getToken = (req, res) => {
  try {
    const API_KEY = process.env.API_KEY;
    const SECRET_KEY = process.env.SECRET_KEY;

    const permissions = req.body.permissions || ["allow_join"];

    const token = jwt.sign(
      {
        apikey: API_KEY,
        permissions,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("[server] ❌ Ошибка генерации токена:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
};

