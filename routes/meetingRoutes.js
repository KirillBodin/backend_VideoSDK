
import express from "express";
import { saveMeeting, getMeetingBySlugTeacherNameClass } from "../controllers/meetingController.js";

const router = express.Router();


router.post("/savemeeting/new", saveMeeting);


router.get("/meet/:slug/:teacherName/:className", getMeetingBySlugTeacherNameClass);

export default router;
