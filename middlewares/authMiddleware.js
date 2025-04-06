const admin = require("../firebaseAdmin");

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; 
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; 
    next(); 
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

module.exports = verifyFirebaseToken;
