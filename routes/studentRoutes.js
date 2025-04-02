import express from "express";
import { checkStudentAccess,getTeachersForStudent,getClassesForStudent } from "../controllers/studentController.js";
import { authenticate } from "../middlewares/authenticate.js";
const router = express.Router();

router.post("/check-access", checkStudentAccess);
router.get("/teachers/:studentId", authenticate, getTeachersForStudent);
router.get("/:id/classes", authenticate, getClassesForStudent);

export default router;
