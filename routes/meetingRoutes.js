
import express from "express";
import {
    saveMeeting,
    getMeetingBySlugTeacherNameClass,
    getClassNameByMeetingId,
  checkAccessToClass,
  getMeetingByClassName,
  getUserRoleByEmail
  } from "../controllers/meetingController.js";

const router = express.Router();


router.post("/savemeeting/new", saveMeeting);


router.post("/savemeeting/new", saveMeeting);
router.get("/meet/:slug/:teacherName/:className", getMeetingBySlugTeacherNameClass);
router.post("/meet/check-access", checkAccessToClass);
router.get("/savemeeting/by-meetingid/:meetingId", getClassNameByMeetingId);
router.get("/getmeeting/by-classname/:className", getMeetingByClassName);
router.post("/users/by-email", getUserRoleByEmail);

export default router;
