import { User, ClassMeeting, Student,ClassStudent,StudentTeacher } from "../models/index.js";
import bcrypt from "bcrypt";



export const getAdminInfo = async (req, res) => {
  const { adminId } = req.params;
  try {
    const admin = await User.findByPk(adminId, {
      attributes: ["id", "name", "email", "schoolName", "role"],
    });
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ error: `No admin found with id=${adminId}` });
    }
    if (req.user.role === "admin" && req.user.id !== Number(adminId)) {
      return res.status(403).json({ error: "You do not have permission to view this admin’s info" });
    }
    res.json(admin);
  } catch (err) {
    console.error("❌ Error fetching admin info:", err);
    res.status(500).json({ error: "Internal server error while fetching admin info" });
  }
};


export const getAdminTeachers = async (req, res) => {
  try {
    const { adminId } = req.params;
    if (req.user.role !== "admin" || req.user.adminId !== Number(adminId)) {
      return res.status(403).json({ error: "You are not authorized to view these teachers" });
    }
    const teachers = await User.findAll({
      where: { adminId, role: "teacher" },
      attributes: ["id", "name", "email"],
    });
    res.json(teachers);
  } catch (err) {
    console.error("❌ Error fetching admin's teachers:", err);
    res.status(500).json({ error: "Internal server error while fetching teachers" });
  }
};


export const updateStudentByAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, email, classIds = [], teacherIds = [] } = req.body;
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: `No student found with id=${studentId}` });
    }
    if (email && email !== student.email) {
      const dup = await Student.findOne({ where: { email } });
      if (dup) {
        return res.status(409).json({ error: `A student with email ${email} already exists` });
      }
    }
    if (name)  student.name  = name;
    if (email) student.email = email;
    await student.save();
    if (Array.isArray(classIds)) {
      const classes = await ClassMeeting.findAll({ where: { id: classIds } });
      await student.setClasses(classes);
    }
    if (Array.isArray(teacherIds)) {
      const teachers = await User.findAll({
        where: { id: teacherIds, role: "teacher" },
      });
      await student.setTeachers(teachers);
    }
    res.json({ message: "Student updated successfully", student });
  } catch (err) {
    console.error("❌ Error updating student by admin:", err);
    res.status(500).json({ error: "Internal server error while updating student" });
  }
};


export const createStudentByAdmin = async (req, res) => {
  const { adminId } = req.params;
  const { name, email, classIds = [], teacherIds = [] } = req.body;
  try {
    if (!name || !email) {
      return res.status(400).json({ error: "Name, email are required" });
    }
    const exists = await Student.findOne({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: `A student with email ${email} already exists` });
    }
    const newStudent = await Student.create({ name, email });
    if (classIds.length)   await newStudent.setClasses(classIds);
    if (teacherIds.length) await newStudent.setTeachers(teacherIds);
    res.status(201).json(newStudent);
  } catch (err) {
    console.error("❌ Error creating student by admin:", err);
    res.status(500).json({ error: "Internal server error while creating student" });
  }
};



export const createClassByAdmin = async (req, res) => {
  try {
    const { className, meetingId, teacherId, studentIds = [] } = req.body;
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "You are not authorized to create classes" });
    }
    if (!className || !meetingId) {
      return res.status(400).json({ error: "className and meetingId are required" });
    }
    let teacherName = null, classUrl = null;
    if (teacherId) {
      const teacher = await User.findByPk(teacherId);
      if (!teacher || teacher.role !== "teacher" || teacher.adminId !== req.user.adminId) {
        return res.status(403).json({ error: "Invalid teacherId or access denied" });
      }
      const slug = meetingId;
      const lastName = teacher.name.split(" ").slice(1).join(" ");
      teacherName = teacher.name;
      classUrl = `${slug}/${lastName}/${className}`;
    }
    const newClass = await ClassMeeting.create({
      className, meetingId, slug: meetingId,
      classUrl, teacherId: teacherId || null, teacherName,
    });
    if (studentIds.length) {
      const students = await Student.findAll({ where: { id: studentIds } });
      await newClass.addStudents(students);
    }
    res.status(201).json(newClass);
  } catch (err) {
    console.error("❌ Error creating class by admin:", err);
    res.status(500).json({ error: "Internal server error while creating class" });
  }
};


export const deleteClassByAdmin = async (req, res) => {
  try {
    const { classId } = req.params;
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "You are not authorized to delete classes" });
    }
    const cls = await ClassMeeting.findByPk(classId);
    if (!cls) {
      return res.status(404).json({ error: `No class found with id=${classId}` });
    }
    const teacher = await User.findByPk(cls.teacherId);
    if (!teacher || teacher.adminId !== req.user.adminId) {
      return res.status(403).json({ error: "You do not have permission to delete this class" });
    }
    await cls.destroy();
    res.json({ message: "Class deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting class by admin:", err);
    res.status(500).json({ error: "Internal server error while deleting class" });
  }
};


export const deleteStudentByAdmin = async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: `No student found with id=${studentId}` });
    }
    await ClassStudent.destroy({ where: { studentId } });
    await StudentTeacher.destroy({ where: { studentId } });
    await student.destroy();
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting student by admin:", err);
    res.status(500).json({ error: "Internal server error while deleting student" });
  }
};


export const deleteTeacherByAdmin = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "You are not authorized to delete teachers" });
    }
    const teacher = await User.findByPk(teacherId);
    if (!teacher || teacher.role !== "teacher" || teacher.adminId !== req.user.adminId) {
      return res.status(403).json({ error: "Invalid teacherId or access denied" });
    }
    await teacher.destroy();
    res.json({ message: "Teacher deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting teacher by admin:", err);
    res.status(500).json({ error: "Internal server error while deleting teacher" });
  }
};


export const createTeacherByAdmin = async (req, res) => {
  const { adminId } = req.params;
  const { name, email, password, classIds = [], studentIds = [] } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const exists = await User.findOne({ where: { email } });
if (exists) {
  return res.status(409).json({ error: `A teacher with this email ${email} already exists` });
}

    const hashed = await bcrypt.hash(password, 10);
    const newTeacher = await User.create({
      name, email, password: hashed, role: "teacher", adminId,
    });
    if (classIds.length)   await newTeacher.setLessons(classIds);
    if (studentIds.length) await newTeacher.setStudents(studentIds);
    res.status(201).json(newTeacher);
  } catch (err) {
    console.error("❌ Error creating teacher by admin:", err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error while creating teacher" });
  }
};




export const getAdminClasses = async (req, res) => {
  try {
    const { adminId } = req.params;
    if (req.user.role !== "admin" || req.user.adminId !== Number(adminId)) {
      return res.status(403).json({ error: "You are not authorized to view these classes" });
    }
    const teachers = await User.findAll({ where: { adminId, role: "teacher" }, attributes: ["id"] });
    const teacherIds = teachers.map(t => t.id);
    const classes = await ClassMeeting.findAll({
      where: { teacherId: teacherIds },
      include: [
        { model: User, as: "teacher", attributes: ["name","email"] },
        { model: Student, as: "students", through:{attributes:[]}, attributes:["name","email"] }
      ],
    });
    res.json(classes);
  } catch (err) {
    console.error("❌ Error fetching admin classes:", err);
    res.status(500).json({ error: "Internal server error while fetching classes" });
  }
};

export const getAdminStudents = async (req, res) => {
  try {
    const { adminId } = req.params;
    if (req.user.role !== "admin" || req.user.adminId !== Number(adminId)) {
      return res.status(403).json({ error: "You are not authorized to view these students" });
    }
    const teachers = await User.findAll({ where: { adminId, role: "teacher" }, attributes:["id"] });
    const teacherIds = teachers.map(t => t.id);
    const students = await Student.findAll({
      include: [
        {
          model: User, as: "teachers",
          where: { id: teacherIds },
          attributes: ["id","name","email"],
          through:{attributes:[]}
        },
        {
          model: ClassMeeting, as: "classes",
          attributes: ["className"],
          through:{attributes:[]}
        }
      ],
    });
    res.json(students);
  } catch (err) {
    console.error("❌ Error fetching admin students:", err);
    res.status(500).json({ error: "Internal server error while fetching students" });
  }
};
