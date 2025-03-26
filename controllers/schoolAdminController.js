import { User } from "../models/index.js";

export const checkEmailPermission = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ exists: false });
    }

    const allowedRoles = ["teacher"];
    const isAllowed = allowedRoles.includes(user.role);

    return res.json({ exists: isAllowed });
  } catch (error) {
    console.error("❌ Error checking email permission:", error);
    res.status(500).json({ error: "Server error" });
  }
};
