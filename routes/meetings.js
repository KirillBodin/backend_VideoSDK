const express = require("express");
const { createMeeting, getMeetingByClass } = require("../controllers/meetingsController");

const router = express.Router();

// 📌 Роут для создания/обновления встречи
router.post("/create-meeting", createMeeting);

// 📌 Роут для получения `meetingId` по `className`
router.get("/class/:className", getMeetingByClass);

module.exports = router;
