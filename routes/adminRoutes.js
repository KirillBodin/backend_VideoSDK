const express = require("express");
const { getAdminTeachers, getAdminStudents, getAdminClasses,createTeacherByAdmin,createClassByAdmin,createStudentByAdmin
    ,deleteTeacherByAdmin,deleteClassByAdmin,deleteStudentByAdmin
 } = require("../controllers/adminController");
 const { authenticate } = require("../middlewares/authenticate");
 const { authorize } = require("../middlewares/authorize");

const router = express.Router();


router.get("/:adminId/teachers",authenticate,  authorize(["admin", "superadmin"]),getAdminTeachers);


router.get("/:adminId/students", authenticate,authorize(["admin", "superadmin"]),getAdminStudents);


router.get("/:adminId/classes", authenticate,authorize(["admin", "superadmin"]),getAdminClasses);



router.post("/:adminId/teachers", authenticate,authorize(["admin", "superadmin"]),createTeacherByAdmin);
router.post("/:adminId/classes", authenticate,authorize(["admin", "superadmin"]),createClassByAdmin);
router.post("/:adminId/students", authenticate,authorize(["admin", "superadmin"]),createStudentByAdmin);


//router.delete("/teachers/:teacherId", deleteTeacherByAdmin);
router.delete("/classes/:classId", authenticate,authorize(["admin", "superadmin"]),deleteClassByAdmin);
router.delete("/students/:studentId", authenticate,authorize(["admin", "superadmin"]),deleteStudentByAdmin);

module.exports = router;
