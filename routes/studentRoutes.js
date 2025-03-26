import express from "express";
import { checkStudentAccess } from "../controllers/studentController.js";

const router = express.Router();

router.post("/check-access", checkStudentAccess);

export default router;
