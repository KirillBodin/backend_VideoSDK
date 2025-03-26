const express = require("express");
const { createMeeting, getMeetingByClass } = require("../controllers/meetingsController");

const router = express.Router();


router.post("/create-meeting", createMeeting);


router.get("/class/:className", getMeetingByClass);

module.exports = router;
