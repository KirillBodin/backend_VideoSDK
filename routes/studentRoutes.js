import express from "express";
import { checkStudentAccess,getTeacherForStudent,getClassesForStudent } from "../controllers/studentController.js";
import { authenticate } from "../middlewares/authenticate.js";
const router = express.Router();

router.post("/check-access", checkStudentAccess);
router.get("/teacher/:studentId", authenticate, getTeacherForStudent);
router.get("/:id/classes", authenticate, getClassesForStudent);

export default router;
