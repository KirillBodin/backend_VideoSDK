import jwt from "jsonwebtoken";


export const resetMeetingId = (req, res) => {
  const { classUrl } = req.body;
  if (global.meetingStore && global.meetingStore[classUrl]) {
    delete global.meetingStore[classUrl];
  }

  res.sendStatus(200);
};


export const getToken = (req, res) => {
  try {
    const API_KEY = process.env.API_KEY;
    const SECRET_KEY = process.env.SECRET_KEY;

    const permissions = req.body.permissions;

    const token = jwt.sign(
      {
        apikey: API_KEY,
        permissions,
      },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("[server] ❌ Failed to generate token:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
};

