import jwt from "jsonwebtoken";

export const getToken = (req, res) => {
  try {
    const API_KEY = "1e5365dc-0fcc-4299-9602-7e1022ffeacc";
    const SECRET_KEY = "e3eb23ffd330656ccb8ed6c17b68f00f04cb4e57f5ed7b2b1ce14948847fa85a";

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

