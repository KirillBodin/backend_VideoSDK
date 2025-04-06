import User from "../models/User.js";
import ClassMeeting from "../models/ClassMeeting.js";
import Student from "../models/Student.js";
import StudentTeacher from "../models/StudentTeacher.js";

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.findAll({ where: { role: "teacher" } });
    const teachersWithCounts = await Promise.all(
      teachers.map(async (teacher) => {
        const numberOfClasses = await ClassMeeting.count({ where: { teacherId: teacher.id } });
        const numberOfStudents = await StudentTeacher.count({ where: { teacherId: teacher.id } });
        const teacherJson = teacher.toJSON();
        teacherJson.numberOfClasses = numberOfClasses;
        teacherJson.numberOfStudents = numberOfStudents;
        return teacherJson;
      })
    );
    res.json(teachersWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const admin = await User.findByPk(id);
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ error: "Director not found" });
    }

    admin.name = name ?? admin.name;
    admin.email = email ?? admin.email;

    if (password) {
      admin.password = password; // consider hashing with bcrypt
    }

    await admin.save();
    res.json({ message: "Director updated", admin });
  } catch (err) {
    console.error("Error updating admin:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const newAdmin = await User.create({
      name,
      email,
      password,
      role: "admin"
    });

    res.status(201).json({
      message: "Director created successfully",
      admin: newAdmin
    });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const admin = await User.findByPk(id);
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ error: "Director not found" });
    }

    await admin.destroy();
    res.json({ message: "Director deleted" });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createTeacher = async (req, res) => {
  try {
    const { teacherName, teacherEmail, teacherPassword } = req.body;
    if (!teacherName || !teacherEmail || !teacherPassword) {
      return res.status(400).json({ error: "Fill in all fields" });
    }

    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const teacher = await User.create({
      name: teacherName,
      email: teacherEmail,
      password: teacherPassword,
      role: "teacher",
      adminId: req.user.adminId || null
    });

    res.status(201).json(teacher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await User.findOne({ where: { id, role: "teacher" } });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    if (teacher.adminId !== req.user.adminId && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    await teacher.destroy();
    res.json({ message: "Teacher deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getAllClasses = async (req, res) => {
  try {
    const classes = await ClassMeeting.findAll();
    const classesWithCounts = await Promise.all(
      classes.map(async (cls) => {
        const numberOfStudents = await cls.countStudents(); 
        const clsJson = cls.toJSON();
        clsJson.numberOfStudents = numberOfStudents;
        return clsJson;
      })
    );
    res.json(classesWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const createClass = async (req, res) => {
  try {
    const { className, teacherId } = req.body;
    if (!className || !teacherId) {
      return res.status(400).json({ error: "Fill in class name and select a teacher" });
    }

    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const meetingId = Math.random().toString(36).substring(2, 11);
    const newClass = await ClassMeeting.create({ className, teacherId, meetingId });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classInstance = await ClassMeeting.findByPk(id);
    if (!classInstance) {
      return res.status(404).json({ error: "Class not found" });
    }

    if (req.user.role === "admin" && classInstance.teacherId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await classInstance.destroy();
    res.json({ message: "Class deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        { model: User, as: "teachers", attributes: ["name"], through: { attributes: [] } },
        { model: ClassMeeting, as: "classes", attributes: ["className"], through: { attributes: [] } },
      ],
    });
    const studentsTransformed = students.map((student) => {
      const studentJson = student.toJSON();
      studentJson.teacherName =
        studentJson.teachers && studentJson.teachers.length > 0
          ? studentJson.teachers[0].name
          : null;
      studentJson.className =
        studentJson.classes && studentJson.classes.length > 0
          ? studentJson.classes[0].className
          : null;
      delete studentJson.teachers;
      delete studentJson.classes;
      return studentJson;
    });
    res.json(studentsTransformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const createStudent = async (req, res) => {
  try {
    const { studentName, studentEmail, classId } = req.body;
    if (!studentName || !studentEmail || !classId) {
      return res.status(400).json({ error: "Fill in name, email and select a class" });
    }

    const classInstance = await ClassMeeting.findByPk(classId);
    if (!classInstance) {
      return res.status(404).json({ error: "Class not found" });
    }

   
    const student = await Student.create({
      name: studentName,
      email: studentEmail,
    });

   
    if (typeof student.addClass === "function") {
      await student.addClass(classInstance);
    }
   
    if (typeof student.addTeacher === "function") {
      await student.addTeacher(classInstance.teacherId);
    }

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
   
    await student.destroy();
    res.json({ message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getAllAdmins = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const admins = await User.findAll({ where: { role: "admin" } });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
