import express from "express";
import { getToken,resetMeetingId  } from "../controllers/tokenController.js";

const router = express.Router();

router.post("/get-token", getToken);
router.post("/reset-meeting", resetMeetingId);
export default router;
