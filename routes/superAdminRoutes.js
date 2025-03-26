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
  deleteAdmin 
} from "../controllers/superAdminController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();


router.get("/teachers", authenticate, authorize("superadmin"),getAllTeachers);
router.post("/teachers", authenticate, authorize("superadmin"),createTeacher);
router.delete("/teachers/:id",authenticate, authorize("superadmin"), deleteTeacher);


router.get("/classes",authenticate, authorize("superadmin"), getAllClasses);
router.post("/classes", authenticate,authorize("superadmin"), createClass);
router.delete("/classes/:id", authenticate,authorize("superadmin"), deleteClass);


router.get("/students", authenticate, authorize("superadmin"),getAllStudents);
router.post("/students", authenticate, authorize("superadmin"),createStudent);
router.delete("/students/:id",authenticate, authorize("superadmin"), deleteStudent);

router.get("/admins", authenticate, authorize("superadmin"),getAllAdmins);
router.post("/admins", authenticate,authorize("superadmin"), createAdmin);
router.put("/admins/:id", authenticate, authorize("superadmin"),updateAdmin);
router.delete("/admins/:id", authenticate, authorize("superadmin"),deleteAdmin);

export default router;
