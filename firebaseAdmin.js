const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json"); // 🔹 Файл с ключами

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();

module.exports = { auth };
