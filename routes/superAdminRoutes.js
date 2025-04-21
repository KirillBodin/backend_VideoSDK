import express from "express";
import {
  getAllTeachers,
  createTeacher,
  deleteTeacher,
  getAllClasses,
  createClass,
  deleteClass,
  getAllStudents,
  createStudent,
  deleteStudent,
  getAllAdmins,
  createAdmin,
  updateAdmin,     
  deleteAdmin,
  getTeacherDetails,
  getClassDetails,
  getStudentDetails,
  updateClass,
  getAdminDetails,
  updateTeacher,
  updateStudent,

} from "../controllers/superAdminController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();


router.get("/teachers", authenticate, authorize("superadmin"),getAllTeachers);
router.post("/teachers", authenticate, authorize("superadmin"),createTeacher);
router.delete("/teachers/:id",authenticate, authorize("superadmin"), deleteTeacher);

router.get("/teachers/:id/details", authenticate, authorize("superadmin"), getTeacherDetails);
router.get("/classes/:id/details", authenticate, authorize("superadmin"), getClassDetails);
router.get("/students/:id/details", authenticate, authorize("superadmin"), getStudentDetails);
router.get("/admins/:id/details", authenticate, authorize("superadmin"), getAdminDetails);


router.get("/classes",authenticate, authorize("superadmin"), getAllClasses);
router.post("/classes", authenticate,authorize("superadmin"), createClass);
router.delete("/classes/:id", authenticate,authorize("superadmin"), deleteClass);
router.put("/classes/:id", authenticate, authorize("superadmin"), updateClass);



router.get("/students", authenticate, authorize("superadmin"),getAllStudents);
router.post("/students", authenticate, authorize("superadmin"),createStudent);
router.delete("/students/:id",authenticate, authorize("superadmin"), deleteStudent);

router.get("/admins", authenticate, authorize("superadmin"),getAllAdmins);
router.post("/admins", authenticate,authorize("superadmin"), createAdmin);
router.put("/admins/:id", authenticate, authorize("superadmin"),updateAdmin);
router.delete("/admins/:id", authenticate, authorize("superadmin"),deleteAdmin);


router.put("/teachers/:id", authenticate, authorize("superadmin"), updateTeacher);


router.put("/students/:id", authenticate, authorize("superadmin"), updateStudent);


export default router;
