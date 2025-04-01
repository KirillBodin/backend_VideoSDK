import express from "express";
import { authorize } from "../middlewares/authorize.js";
import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherLessons,
  createLesson,
  createStudent,
  getStudentsByTeacher,
  updateLesson,
  updateStudent,
  deleteLesson,
  deleteStudent,
  getStudentsByLesson,
  getTeacherAdmin,
  getTeacherByLessonId
} from "../controllers/teacherController.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();


router.get("/teachers",authenticate, getTeachers);

router.put("/teacher/:teacherId/students/:studentId",authenticate, authorize(["teacher", "admin", "superadmin"]),updateStudent);


router.get("/teachers/:teacherId",authenticate, authorize(["teacher", "admin", "superadmin"]),getTeacherById);

router.put("/lessons/:lessonId",authenticate,authorize(["teacher", "admin", "superadmin"]),updateLesson);




router.post("/teachers", authenticate,authorize(["teacher", "admin", "superadmin"]),createTeacher);


router.put("/teachers/:teacherId", authenticate,authorize(["teacher", "admin", "superadmin"]),updateTeacher);


router.post("/teachers/:teacherId/lessons",authenticate, authorize(["teacher", "admin", "superadmin"]),createLesson);


router.post("/teacher/:teacherId/students",authenticate, authorize(["teacher", "admin", "superadmin"]),createStudent);
router.get("/lessons/:lessonId/students", authenticate,authorize(["teacher", "admin", "superadmin"]),getStudentsByLesson);


router.delete("/teachers/:teacherId",authenticate, authorize(["teacher", "admin", "superadmin"]),deleteTeacher);

router.get("/teachers/:teacherId/lessons", authenticate,getTeacherLessons); 

router.delete("/teacher/:teacherId/students/:studentId", authenticate,authorize(["teacher", "admin", "superadmin"]),deleteStudent);

router.get("/teacher/:teacherId/students", authenticate,authorize(["teacher", "admin", "superadmin"]),getStudentsByTeacher);

router.delete("/lessons/:lessonId",authenticate,deleteLesson);

router.get("/teacher/:teacherId/admin", authenticate, authorize(["teacher", "admin", "superadmin"]), getTeacherAdmin);

router.get("/lessons/:lessonId/teacher",authenticate,authorize(["teacher", "admin", "superadmin"]),getTeacherByLessonId);


export default router;
