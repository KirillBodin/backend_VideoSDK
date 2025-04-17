import express from "express";
import {
  getAdminTeachers,
  getAdminStudents,
  getAdminClasses,
  createTeacherByAdmin,
  createClassByAdmin,
  createStudentByAdmin,
  deleteTeacherByAdmin,
  deleteClassByAdmin,
  deleteStudentByAdmin,
  updateStudentByAdmin,
  getAdminInfo
} from "../controllers/adminController.js";

import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.get("/:adminId", authenticate, authorize(["admin", "superadmin"]), getAdminInfo);
router.get("/:adminId/teachers",authenticate,  authorize(["admin", "superadmin"]),getAdminTeachers);


router.get("/:adminId/students", authenticate,authorize(["admin", "superadmin"]),getAdminStudents);


router.get("/:adminId/classes", authenticate,authorize(["admin", "superadmin"]),getAdminClasses);

router.put("/:adminId/students/:studentId", authenticate, authorize(["admin", "superadmin"]), updateStudentByAdmin);


router.post("/:adminId/teachers", authenticate,authorize(["admin", "superadmin"]),createTeacherByAdmin);
router.post("/:adminId/classes", authenticate,authorize(["admin", "superadmin"]),createClassByAdmin);
router.post("/:adminId/students", authenticate,authorize(["admin", "superadmin"]),createStudentByAdmin);


//router.delete("/teachers/:teacherId", deleteTeacherByAdmin);
router.delete("/classes/:classId", authenticate,authorize(["admin", "superadmin"]),deleteClassByAdmin);
router.delete("/students/:studentId", authenticate,authorize(["admin", "superadmin"]),deleteStudentByAdmin);

export default router; 

