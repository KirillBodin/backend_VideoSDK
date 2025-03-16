const admin = require("../firebaseAdmin");

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Ожидаем `Bearer <token>`
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Добавляем user в `req`
    next(); // Продолжаем выполнение запроса
  } catch (error) {
    console.error("❌ Ошибка проверки токена:", error);
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

module.exports = verifyFirebaseToken;
